---
title: "New Interactive: Three Bank Accounts"
description: "Explore the 1994 IMO Shortlist problem about emptying bank accounts through a three-tab interactive — play, explore, and step through the solution."
date: "2026-04-17"
published: "2026-04-17"
author: "Neeldhara Misra"
tags: ["new-interactive", "contest-problems", "imo", "number-theory"]
---

We've just added a new interactive based on a beautiful problem from the **1994 IMO Shortlist**:

> Peter has three bank accounts, each containing a positive integer number of dollars. He can transfer money between accounts, but with one rule: a transfer must *exactly double* the balance of the recipient account. Prove that Peter can always empty one of the accounts.

## What's in the interactive?

The interactive has three tabs:

### Play
A spoiler-free sandbox where you can experiment freely. Set starting balances (or pick from presets like Easy, Medium, Hard), and try to empty an account yourself. The game shows you all legal transfers color-coded by MIN/MID/MAX roles, and tracks your moves in a log. When two accounts tie, only the tie-breaking transfers are available — and one more move finishes the puzzle.

### Explore
The same sandbox, but with guided discovery overlays. You can see the sorted values (L, M, N), the key quantity floor(M/L), and toggle a binary view to notice the pattern yourself. A hint is available if you're stuck.

### Solution
A step-by-step walkthrough of the algorithm. The key insight: write floor(M/L) in binary. Each bit tells you which account to transfer from — 1 means MID to MIN, 0 means MAX to MIN. After processing all bits, the minimum strictly decreases, and you repeat until an account hits zero. You can step through one transfer at a time, scrub with a slider, or run to completion.

The solution tab also includes a link to [a beautiful video exposition](https://www.youtube.com/watch?v=KErFxmsdrFM) by Dr. Sucharit Sarkar (IMO 2001 gold, IMO 2002 silver).

## Try it out

Head over to the [Three Bank Accounts interactive](/i/three-bank-accounts) and give it a try!
