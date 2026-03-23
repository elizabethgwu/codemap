# Greybox — 8-Minute Demo Script
**Liz Wu · Anthropic Take-Home · Option B: Learning through Collaboration with Claude**

*Target pace: ~130 words/minute · Total: ~1,050 words · Runtime: ~8 minutes*
*[Bracketed notes] are stage directions — don't read aloud*

---

## PART 1 — Why Option B (~ 1.5 minutes)

When I first read the two options, Option A felt more immediately tractable — there's a clear metric, a clear surface area. But I kept coming back to something that felt more fundamental to me, which is: **what happens to the person on the other side of the conversation?**

When I use Claude, I notice that I learn a lot — but almost by accident. I understand things better after working through them with Claude, but I couldn't always tell you *why*. The reasoning happens, the answer appears, and I move on. And that's fine for getting things done. But it means I'm getting better at asking Claude questions, not better at the underlying problem.

That tension is what pulled me toward Option B. The question isn't just "does Claude help?" — it's "does working with Claude make you more capable over time?" Those are very different design goals.

I also want to be honest about my starting point: I mainly use the **Chat** panel. I don't love handing off full tasks because I want to understand what's happening. That's a real user need — people who want to collaborate, not just delegate. I think there's an underserved space between "complete this for me" and "explain this to me line by line," and that's where I wanted to build.

---

## PART 2 — Research Process (~ 1 minute)

Before writing a single line of code, I talked to four people.

**Syd**, a staff designer, said: "We're visual beings — why do we represent the same information in so many different ways? Calendars, kanban boards, to-do lists. They're all the same data, just shaped differently." That framing stuck with me.

**Stacey**, a learning designer with a master's in education, pointed me toward research on collaborative, self-regulated learning — specifically the idea that AI should *enhance* the cognitive work, not replace it.

**Arun**, a PhD candidate in chemistry, said he can't use AI-generated code because he can't see what variables were assumed and why. He needs to go back and change things later, and the reasoning is invisible.

And **Paige**, a motion designer, said: "I just want scaffolding. It's too hard to parse everything all at once."

What I heard across all four was the same thing: **too much output, not enough understanding.** So the question became — how do you make the reasoning navigable?

---

## PART 3 — Demo Walkthrough (~ 5 minutes)

[*Open the Greybox app. Paste in a medium-length code snippet — ideally something with a conditional and a return value, around 20-30 lines.*]

This is **Greybox**. The name comes from Andrew Witt's concept of "greyboxing" — the idea that instead of making AI fully opaque (black box) or fully explicit (white box), you design for a middle state where the internal logic is partially surfaced and intervention is possible at key stages.

When I paste code and submit, Claude analyzes it and returns a structured result. Let me show you what that looks like.

[*Submit the code. Wait for the analysis to load.*]

---

**The Node Map** is the first thing you see. Claude has decomposed the code into 3 to 8 nodes — logical chunks — and laid them out as a force-directed graph. The nodes are color-coded and shape-coded: hexagons for scope, rectangles for process, diamonds for decisions, rounded rectangles for output. The shapes aren't decorative — they're there because color alone isn't enough for colorblind users.

[*Click a node.*]

When I click a node, the **Node Inspector** opens. This shows me the label, the line range, what Claude understood this chunk to be doing, the variables in play at that point, and — importantly — Claude's assumptions. Assumptions have confidence levels: high, medium, low. This is where Arun's frustration gets addressed. You can see exactly what was assumed and why.

[*Switch to split view.*]

---

**Split view** links the graph to the **Code Panel**. Each line of code has a colored border matching its node. If I click on a node in the graph, the corresponding code highlights. If I click a line in the code, the node activates. This is the dual-coding principle in action — the same information in two representations, reinforcing each other.

For decision nodes, you get an inline overlay in the code itself showing what Claude chose and what alternatives existed. That's the epistemic transparency piece — you can see not just what Claude did, but what it *almost* did.

[*Open the Concepts panel.*]

---

**The Concepts panel** is my favorite part. For each analysis, Claude generates one to three concept cards — the underlying programming principles at work, written in plain language. Not documentation, not jargon — the kind of explanation you'd give a smart person who's new to the pattern.

This serves two audiences differently. A beginner uses it to understand what they're looking at. An experienced engineer uses it to check their mental model or remember a pattern they've used before.

[*Open the Critique panel.*]

---

**The Critique panel** shows two to four genuinely different ways the code could have been structured — with tradeoffs, complexity labels, and short code examples. This is the pseudo-conversation I wanted: not Claude telling you what's wrong, but Claude showing you the space of alternatives and letting you decide what matters.

---

## PART 4 — Closing Reflection (~ 30 seconds)

The prototype has real limitations — it breaks on large files, the node layout doesn't handle cycles well, and there are no tests. I found all of this during testing and wrote about it honestly.

But the thing I'm most interested in is whether this pattern — visually navigable reasoning, layered by depth, with intervention points — generalizes beyond code. Math problem decomposition. Narrative logic in writing. I think it might.

The core bet is simple: **if you can see where the reasoning went, you can change where it goes next.** That's what learning through collaboration should feel like.

---

*End of script — ~1,050 words · ~8 minutes*
