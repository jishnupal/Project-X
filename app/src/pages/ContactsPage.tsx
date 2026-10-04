import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GuestDayPlan } from "../components/guest/GuestDayPlan";
import { MobileSheet } from "../components/ui/MobileSheet";
import { Icon } from "../components/ui/Icon";
import { useAccess } from "../hooks/useAccess";
import { useAuth } from "../hooks/useAuth";
import { useWeddingState } from "../hooks/useWeddingState";
import { functionIds } from "../domain/functions";
import {
  applyStayCountChange,
  applyStayToggle,
  applyTotalCountChange,
  assignGuestToGroup,
  createGuestFromDraft,
  createGuestGroup,
  MAX_GUEST_GROUPS,
  normalizeGuestRow,
  removeGuestGroup,
  setGuestDayCount,
  syncEventGuestCount,
  touchGuestGroup,
  touchGuestRow,
} from "../domain/guest";
import type { GuestGroup, GuestRow } from "../domain/types";

type AddDraft = {
  name: string;
  count: string;
  sangeetCount: string;
  biyebariCount: string;
  receptionCount: string;
  borjatriCount: string;
  dayCounts: Record<string, string>;
  stayCount: string;
  needsStay: boolean;
  groupId: string;
};

function emptyAddDraft(days: number[]): AddDraft {
  const dayCounts: Record<string, string> = {};
  for (const day of days) dayCounts[String(day)] = "1";
  const draft: AddDraft = {
    name: "",
    count: "1",
    sangeetCount: dayCounts["1"] || "0",
    biyebariCount: dayCounts["2"] || "0",
    receptionCount: dayCounts["3"] || "0",
    borjatriCount: dayCounts["4"] || "0",
    dayCounts,
    stayCount: "0",
    needsStay: false,
    groupId: "",
  };
  return draft;
}

function draftAsRow(draft: AddDraft): GuestRow {
  return normalizeGuestRow({
    id: "draft",
    name: draft.name,
    count: draft.count,
    sangeetCount: draft.sangeetCount,
    biyebariCount: draft.biyebariCount,
    receptionCount: draft.receptionCount,
    borjatriCount: draft.borjatriCount,
    dayCounts: draft.dayCounts,
    stayCount: draft.needsStay ? draft.stayCount || draft.count : "0",
    needsStay: draft.needsStay,
    groupId: draft.groupId,
  });
}

function rowAsDraft(row: GuestRow, name: string, groupId: string): AddDraft {
  return {
    name,
    count: row.count,
    sangeetCount: row.sangeetCount,
    biyebariCount: row.biyebariCount,
    receptionCount: row.receptionCount,
    borjatriCount: row.borjatriCount,
    dayCounts: { ...(row.dayCounts || {}) },
    stayCount: row.stayCount,
    needsStay: row.needsStay,
    groupId,
  };
}

type Section = "contacts" | "groups";

function letterOf(name: string) {
  const char = name.trim()[0]?.toUpperCase() || "#";
  return /[A-Z]/.test(char) ? char : "#";
}

function peopleLabel(count: string) {
  const n = Math.max(1, Number(count) || 1);
  return n === 1 ? "1 person" : `${n} people`;
}

export function ContactsPage() {
  const { state, setState, showToast } = useWeddingState();
  const { canAccessModule } = useAccess();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const canEdit = canAccessModule("guests", "edit");
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googlePeople, setGooglePeople] = useState<{ id: string; name: string }[]>([]);
  const [googleQuery, setGoogleQuery] = useState("");
  const [googlePicked, setGooglePicked] = useState<string[]>([]);
  const [googleStatus, setGoogleStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [googleError, setGoogleError] = useState("");
  const [section, setSection] = useState<Section>("contacts");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState<string | null>(null);
  const [addDraft, setAddDraft] = useState<AddDraft>(() => emptyAddDraft([]));
  const [newGroupName, setNewGroupName] = useState("");

  const guests = state.guests || [];
  const groups = state.guestGroups || [];
  const editing = guests.find((row) => row.id === editingId) || null;
  const openGroup = groups.find((group) => group.id === groupOpen) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [...guests].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }),
    );
    if (!q) return rows;
    return rows.filter((row) => {
      const group = groups.find((item) => item.id === row.groupId)?.name || "";
      return `${row.name} ${group}`.toLowerCase().includes(q);
    });
  }, [guests, groups, query]);

  const letters = useMemo(() => {
    const map = new Map<string, GuestRow[]>();
    for (const row of filtered) {
      const key = letterOf(row.name || "");
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const refuse = () => showToast("You can look, not edit");

  const saveGuests = (next: GuestRow[]) => {
    setState((prev) => ({
      ...prev,
      guests: next,
      event: { ...prev.event, guests: syncEventGuestCount(next) },
    }));
  };

  const patchGuest = (id: string, next: GuestRow) => {
    saveGuests(guests.map((row) => (row.id === id ? next : row)));
  };

  const askGoogle = () => {
    const params = new URLSearchParams({ contacts: "1", return: "/people/contacts" });
    if (user?.email) params.set("hint", user.email);
    window.location.href = `/api/auth/login?${params.toString()}`;
  };

  const loadGoogle = async (allowRedirect: boolean) => {
    setGoogleStatus("loading");
    setGoogleError("");
    const res = await fetch("/api/google/contacts", { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (data.needAuth) {
      if (allowRedirect) askGoogle();
      else {
        setGoogleStatus("error");
        setGoogleError("Google did not share contacts.");
      }
      return;
    }
    if (!res.ok) {
      setGoogleStatus("error");
      setGoogleError(data.error || "Could not read Google contacts.");
      return;
    }
    setGooglePeople(Array.isArray(data.people) ? data.people : []);
    setGoogleStatus("ready");
  };

  const openGoogle = () => {
    if (!canEdit) return refuse();
    setGooglePicked([]);
    setGoogleQuery("");
    setGoogleOpen(true);
    void loadGoogle(true);
  };

  useEffect(() => {
    const flag = searchParams.get("google");
    if (!flag) return;
    if (flag === "1") {
      setGoogleOpen(true);
      void loadGoogle(false);
    }
    if (flag === "other") showToast("Use the Google account you signed in with.");
    const next = new URLSearchParams(searchParams);
    next.delete("google");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const startAdd = () => {
    if (!canEdit) return refuse();
    setAddDraft(emptyAddDraft(functionIds(state)));
    setAdding(true);
  };

  const patchAdd = (mutate: (row: GuestRow) => GuestRow) => {
    setAddDraft((current) => {
      const next = mutate(draftAsRow(current));
      return rowAsDraft(next, current.name, current.groupId);
    });
  };

  const addPerson = () => {
    const name = addDraft.name.trim();
    if (!name) {
      showToast("Add a name");
      return;
    }
    const row = createGuestFromDraft({
      name,
      count: addDraft.count || "1",
      receptionCount: addDraft.receptionCount,
      sangeetCount: addDraft.sangeetCount,
      biyebariCount: addDraft.biyebariCount,
      borjatriCount: addDraft.borjatriCount,
      dayCounts: addDraft.dayCounts,
      stayCount: addDraft.needsStay ? addDraft.stayCount || addDraft.count : "0",
      groupId: addDraft.groupId,
    });
    saveGuests([...guests, row]);
    setAdding(false);
    showToast("Person added");
  };

  const saveName = (row: GuestRow, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === row.name) return;
    patchGuest(row.id, touchGuestRow({ ...row, name: trimmed }));
  };

  const addGroup = () => {
    if (!canEdit) return refuse();
    const name = newGroupName.trim();
    if (!name) return;
    if (groups.length >= MAX_GUEST_GROUPS) {
      showToast("Maximum 10 groups");
      return;
    }
    const group = createGuestGroup(name);
    setState((prev) => ({
      ...prev,
      guestGroups: [...(prev.guestGroups || []), group],
    }));
    setNewGroupName("");
    setGroupOpen(group.id);
    showToast("Group made");
  };

  const renameGroup = (group: GuestGroup, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === group.name) return;
    setState((prev) => ({
      ...prev,
      guestGroups: (prev.guestGroups || []).map((item) =>
        item.id === group.id ? touchGuestGroup({ ...item, name: trimmed }) : item,
      ),
    }));
  };

  const deleteGroup = (group: GuestGroup) => {
    if (!canEdit) return refuse();
    setState((prev) => removeGuestGroup(prev, group.id));
    setGroupOpen(null);
    showToast("Group removed");
  };

  const googleShown = useMemo(() => {
    const q = googleQuery.trim().toLowerCase();
    if (!q) return googlePeople;
    return googlePeople.filter((person) => person.name.toLowerCase().includes(q));
  }, [googlePeople, googleQuery]);

  const addFromGoogle = () => {
    const picked = new Set(googlePicked);
    const have = new Set(guests.map((row) => (row.name || "").trim().toLowerCase()));
    const chosen = googlePeople.filter((person) => picked.has(person.id) && !have.has(person.name.toLowerCase()));
    if (!chosen.length) {
      showToast(googlePicked.length ? "Those people are already here." : "Pick someone");
      return;
    }
    const rows = chosen.map((person) =>
      createGuestFromDraft({
        name: person.name,
        count: "1",
        receptionCount: "",
        sangeetCount: "0",
        biyebariCount: "0",
        borjatriCount: "0",
        stayCount: "0",
        groupId: "",
      }),
    );
    saveGuests([...guests, ...rows]);
    setGoogleOpen(false);
    showToast(chosen.length === 1 ? "1 person added" : `${chosen.length} people added`);
  };

  const deletePerson = (row: GuestRow) => {
    if (!canEdit) return refuse();
    saveGuests(guests.filter((item) => item.id !== row.id));
    setEditingId(null);
    showToast("Person removed");
  };

  return (
    <div className="font-[Manrope,sans-serif] mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col bg-[#fff8f5] text-black">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-2">
        <header className="contacts-keeper">
          <div className="contacts-keeper__copy">
            <p className="text-[13px] font-medium text-[#584141]">People</p>
            <h1 className="mt-1 text-[34px] font-extrabold leading-none tracking-[-0.045em]">Contacts</h1>
            <p className="mt-2 text-[15px] font-medium leading-snug text-[#584141]">
              {section === "contacts"
                ? guests.length === 0
                  ? "Add the people. She holds each one."
                  : `${guests.length === 1 ? "1 person" : `${guests.length} people`} on the list.`
                : groups.length === 0
                  ? "Make a group. She stacks them."
                  : `${groups.length === 1 ? "1 group" : `${groups.length} groups`} made.`}
            </p>
          </div>
          <div className="contacts-keeper__figure">
            <div className="contacts-keeper__sway">
            <img src="/home/contacts-keeper.png" alt="" />
            <button
              key={section}
              type="button"
              className={`contacts-keeper__card${section === "groups" ? " is-group" : ""}`}
              aria-label={section === "contacts" ? "Add a person" : "New group"}
              onClick={() => {
                if (section === "contacts") startAdd();
                else document.getElementById("new-group-name")?.focus();
              }}
            >
              {section === "contacts" ? "Add" : "New"}
            </button>
            </div>
          </div>
        </header>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-[#ece7e2] p-1">
          {(
            [
              ["contacts", "Contacts"],
              ["groups", "Groups"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`h-10 rounded-full text-[15px] font-semibold ${
                section === id ? "bg-[#feca43] text-black" : "text-[#584141]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === "contacts" ? (
          <div className="mt-4">
            <label className="flex h-11 items-center gap-2 rounded-full bg-white px-3.5">
              <Icon name="search" className="text-[18px] text-[#584141]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people"
                className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#b5a9a4]"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startAdd}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#feca43] px-4 text-[15px] font-semibold"
              >
                <Icon name="person_add" className="text-[18px]" />
                Add a person
              </button>
              <button
                type="button"
                onClick={openGoogle}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold"
              >
                From Google
              </button>
            </div>

            {letters.length === 0 ? (
              <p className="mt-8 text-[15px] font-medium text-[#584141]">
                {guests.length === 0 ? "No people yet." : "No one matches that."}
              </p>
            ) : (
              <div className="mt-5 space-y-5">
                {letters.map(([letter, rows]) => (
                  <section key={letter}>
                    <h2 className="px-1 text-[13px] font-bold tracking-[0.08em] text-[#584141]">{letter}</h2>
                    <ul className="mt-2 overflow-hidden rounded-[22px] bg-[#fffdf8]">
                      {rows.map((row) => {
                        const group = groups.find((item) => item.id === row.groupId);
                        return (
                          <li key={row.id} className="border-t border-[#ece7e2] first:border-t-0">
                            <button
                              type="button"
                              onClick={() => setEditingId(row.id)}
                              className="flex w-full items-center gap-3 px-3 py-3 text-left"
                            >
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#feca43] text-[16px] font-bold">
                                {letterOf(row.name)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[16px] font-semibold">{row.name || "Unnamed"}</span>
                                <span className="block truncate text-[13px] font-medium text-[#584141]">
                                  {group?.name || "No group"} · {peopleLabel(row.count)}
                                </span>
                              </span>
                              <Icon name="chevron_right" className="text-[18px] text-[#584141]" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addGroup();
              }}
            >
              <input
                id="new-group-name"
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                placeholder="New group"
                className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[15px] outline-none"
              />
              <button type="submit" className="h-11 rounded-full bg-[#feca43] px-4 text-[15px] font-semibold">
                Make
              </button>
            </form>
            {groups.length === 0 ? (
              <p className="mt-8 text-[15px] font-medium text-[#584141]">No groups yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {groups.map((group) => {
                  const members = guests.filter((row) => row.groupId === group.id);
                  return (
                    <li key={group.id}>
                      <button
                        type="button"
                        onClick={() => setGroupOpen(group.id)}
                        className="flex w-full items-center gap-3 rounded-[22px] bg-[#fffdf8] px-3 py-3 text-left"
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff8f5] text-[18px]">
                          <Icon name="groups" className="text-[22px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-semibold">{group.name}</span>
                          <span className="block text-[13px] font-medium text-[#584141]">
                            {members.length === 1 ? "1 contact" : `${members.length} contacts`}
                          </span>
                        </span>
                        <Icon name="chevron_right" className="text-[18px] text-[#584141]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <p className="mt-8 text-[13px] font-medium text-[#584141]">
          Who is coming to each part lives in{" "}
          <Link to="/people/guests" className="font-semibold text-black underline">
            Scene
          </Link>
          .
        </p>
      </div>

      <MobileSheet
        open={googleOpen}
        onClose={() => setGoogleOpen(false)}
        title="From Google"
        height="tall"
        panelClassName="bg-[#fff8f5]"
      >
        <div className="flex h-full min-h-0 flex-col px-4 pb-6">
          <p className="text-[13px] font-medium text-[#584141]">
            {user?.email ? `People in ${user.email}` : "People in the Google account you signed in with."}
          </p>
          {googleStatus === "ready" ? (
            <label className="mt-3 flex h-11 items-center gap-2 rounded-full bg-white px-3.5">
              <Icon name="search" className="text-[18px] text-[#584141]" />
              <input
                value={googleQuery}
                onChange={(event) => setGoogleQuery(event.target.value)}
                placeholder="Search Google contacts"
                className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#b5a9a4]"
              />
            </label>
          ) : null}
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {googleStatus === "loading" ? (
              <p className="py-8 text-[15px] font-medium text-[#584141]">Opening Google…</p>
            ) : null}
            {googleStatus === "error" ? (
              <p className="py-8 text-[15px] font-medium text-[#584141]">{googleError}</p>
            ) : null}
            {googleStatus === "ready" && googleShown.length === 0 ? (
              <p className="py-8 text-[15px] font-medium text-[#584141]">
                {googlePeople.length === 0 ? "No contacts in this Google account." : "No one matches that."}
              </p>
            ) : null}
            {googleStatus === "ready" && googleShown.length > 0 ? (
              <ul className="overflow-hidden rounded-[22px] bg-[#fffdf8]">
                {googleShown.map((person) => {
                  const on = googlePicked.includes(person.id);
                  return (
                    <li key={person.id} className="border-t border-[#ece7e2] first:border-t-0">
                      <button
                        type="button"
                        onClick={() =>
                          setGooglePicked((current) =>
                            current.includes(person.id)
                              ? current.filter((id) => id !== person.id)
                              : [...current, person.id],
                          )
                        }
                        className="flex w-full items-center gap-3 px-3 py-3 text-left"
                      >
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                            on ? "border-[#feca43] bg-[#feca43]" : "border-[#ece7e2] bg-white"
                          }`}
                        >
                          {on ? <Icon name="check" className="text-[16px]" /> : null}
                        </span>
                        <span className="truncate text-[16px] font-semibold">{person.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
          {googleStatus === "ready" ? (
            <button
              type="button"
              onClick={addFromGoogle}
              className="mt-3 h-12 w-full rounded-full bg-[#feca43] text-[16px] font-semibold"
            >
              {googlePicked.length ? `Add ${googlePicked.length}` : "Add"}
            </button>
          ) : null}
        </div>
      </MobileSheet>

      <MobileSheet open={adding} onClose={() => setAdding(false)} title="New person" height="tall" panelClassName="bg-[#fff8f5]">
        <form
          className="space-y-4 px-4 pb-8"
          onSubmit={(event) => {
            event.preventDefault();
            addPerson();
          }}
        >
          <Field label="Name" value={addDraft.name} onChange={(value) => setAddDraft((current) => ({ ...current, name: value }))} />
          <GuestDayPlan
            state={state}
            total={Math.max(1, Number(addDraft.count) || 1)}
            counts={addDraft}
            needsStay={addDraft.needsStay}
            onTotalChange={(value) => patchAdd((row) => applyTotalCountChange(row, String(value)))}
            onDayChange={(dayId, value) =>
              patchAdd((row) => setGuestDayCount(row, dayId, String(value)))
            }
            onStayToggle={(on) => patchAdd((row) => applyStayToggle(row, on))}
            onStayCountChange={(value) => patchAdd((row) => applyStayCountChange(row, String(value)))}
          />
          <GroupPick
            groups={groups}
            value={addDraft.groupId}
            onChange={(groupId) => setAddDraft((current) => ({ ...current, groupId }))}
          />
          <button type="submit" className="h-12 w-full rounded-full bg-[#feca43] text-[16px] font-semibold">
            Add
          </button>
        </form>
      </MobileSheet>

      <MobileSheet
        open={Boolean(editing)}
        onClose={() => setEditingId(null)}
        title="Contact"
        height="tall"
        panelClassName="bg-[#fff8f5]"
      >
        {editing ? (
          <div className="space-y-4 px-4 pb-8">
            <p className="rounded-[18px] bg-white px-4 py-3 text-center text-[12px] font-medium leading-snug text-[#584141]">
              Send WhatsApp invites from Home →{" "}
              <Link to="/command-center" className="font-semibold text-[#2c2419] underline">
                Invitations
              </Link>
              .
            </p>
            <Field
              label="Name"
              value={editing.name}
              onChange={(value) => patchGuest(editing.id, touchGuestRow({ ...editing, name: value }))}
              onBlur={() => saveName(editing, editing.name)}
            />
            <GuestDayPlan
              state={state}
              total={Math.max(1, Number(editing.count) || 1)}
              counts={editing}
              needsStay={editing.needsStay}
              onTotalChange={(value) => patchGuest(editing.id, applyTotalCountChange(editing, String(value)))}
              onDayChange={(dayId, value) =>
                patchGuest(editing.id, setGuestDayCount(editing, dayId, String(value)))
              }
              onStayToggle={(on) => patchGuest(editing.id, applyStayToggle(editing, on))}
              onStayCountChange={(value) =>
                patchGuest(editing.id, applyStayCountChange(editing, String(value)))
              }
            />
            <GroupPick
              groups={groups}
              value={editing.groupId}
              onChange={(groupId) => patchGuest(editing.id, assignGuestToGroup(editing, groupId))}
            />
            {editing.invitationSent ? (
              <div className="rounded-[22px] bg-[#fffdf8] px-4 py-3">
                <p className="text-[16px] font-semibold text-black">Invitation sent</p>
                <p className="mt-1 text-[13px] font-medium text-[#584141]">
                  Resend from Invitations — this can’t be marked unsent.
                </p>
              </div>
            ) : (
              <Toggle
                label="Invitation sent"
                on={false}
                onChange={(on) => {
                  if (!on) return;
                  patchGuest(
                    editing.id,
                    touchGuestRow({
                      ...editing,
                      invitationSent: true,
                      inviteStatus: "Sent",
                    }),
                  );
                }}
              />
            )}
            <Toggle
              label="Buddy"
              on={editing.isBuddy}
              onChange={(on) => patchGuest(editing.id, touchGuestRow({ ...editing, isBuddy: on }))}
            />
            <button
              type="button"
              onClick={() => deletePerson(editing)}
              className="h-12 w-full rounded-full bg-[#424242] text-[16px] font-semibold text-white"
            >
              Remove
            </button>
          </div>
        ) : null}
      </MobileSheet>

      <MobileSheet
        open={Boolean(openGroup)}
        onClose={() => setGroupOpen(null)}
        title={openGroup?.name || "Group"}
        height="tall"
        panelClassName="bg-[#fff8f5]"
      >
        {openGroup ? (
          <div className="space-y-4 px-4 pb-8">
            <Field label="Group name" value={openGroup.name} onChange={(value) => renameGroup(openGroup, value)} />
            <ul className="overflow-hidden rounded-[22px] bg-[#fffdf8]">
              {guests.filter((row) => row.groupId === openGroup.id).length === 0 ? (
                <li className="px-3 py-4 text-[15px] font-medium text-[#584141]">No one in this group yet.</li>
              ) : (
                guests
                  .filter((row) => row.groupId === openGroup.id)
                  .map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 border-t border-[#ece7e2] px-3 py-3 first:border-t-0">
                      <span className="truncate text-[16px] font-semibold">{row.name}</span>
                      <button
                        type="button"
                        onClick={() => patchGuest(row.id, assignGuestToGroup(row, ""))}
                        className="shrink-0 text-[13px] font-semibold text-[#584141]"
                      >
                        Remove
                      </button>
                    </li>
                  ))
              )}
            </ul>
            <p className="text-[13px] font-medium text-[#584141]">Add someone from Contacts, then pick this group.</p>
            <button
              type="button"
              onClick={() => deleteGroup(openGroup)}
              className="h-12 w-full rounded-full bg-[#424242] text-[16px] font-semibold text-white"
            >
              Delete group
            </button>
          </div>
        ) : null}
      </MobileSheet>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputMode?: "text" | "numeric";
}) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-[13px] font-medium text-[#584141]">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="h-12 w-full rounded-2xl bg-white px-3 text-[16px] outline-none"
      />
    </label>
  );
}

function GroupPick({
  groups,
  value,
  onChange,
}: {
  groups: GuestGroup[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-[13px] font-medium text-[#584141]">Group</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl bg-white px-3 text-[16px] outline-none"
      >
        <option value="">No group</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex h-12 w-full items-center justify-between rounded-2xl bg-white px-3 text-left"
    >
      <span className="text-[16px] font-semibold">{label}</span>
      <span className={`h-7 w-12 rounded-full p-1 ${on ? "bg-[#feca43]" : "bg-[#ece7e2]"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white ${on ? "ml-auto" : ""}`} />
      </span>
    </button>
  );
}
