#!/bin/zsh
export PATH="$HOME/.local/bin:/opt/homebrew/bin:$PATH"
set -e
echo ""
echo "=== BiyeFlow: GitHub auth + push ==="
echo "Approving in the Cursor-opened browser earlier did NOT save a token,"
echo "because Cursor's agent cannot talk to api.github.com (403 Forbidden)."
echo "This Terminal session can — complete login HERE."
echo ""
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
echo ""
echo "Auth OK. Pushing…"
cd /Users/subhangipaul/Downloads/Project-X
git push origin main
git push origin pre-ui-revamp-mobile
git checkout feature/ui-revamp-mobile
git push -u origin feature/ui-revamp-mobile
echo ""
echo "SUCCESS — main + tag + feature/ui-revamp-mobile are on GitHub."
git status -sb
git branch -vv
echo ""
echo "You can close this window and tell Cursor: pushed"
exec zsh
