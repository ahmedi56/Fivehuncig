# FivehunCig: Evidence-Based Upgrade Plan for Quitting and Cutting Down

The biggest improvement FivehunCig can make is to become a **bridge to the treatments that really work** — combination NRT, varenicline, cytisine, nicotine e-cigarettes, and human or text-based support. Each of these roughly doubles quit odds or adds about 50% to them. Mini-games, by contrast, only cut a single craving by a modest, short-lived amount. Build the games well and measure them, but don't let them replace the pharmacotherapy and support funnel.

## TL;DR
- **What works:** The best-supported options are varenicline, cytisine, nicotine e-cigarettes and combination NRT. Cochrane's 2023 network meta-analysis estimates that 10–19 people in 100 quit with these, and gives odds ratios around 2.3 versus control. Automated text messaging (RR 1.54), financial incentives (Cochrane 2025: RR 1.52, high certainty) and if-then plans (OR 1.70, but heterogeneous) add real benefit. Standalone apps, mindfulness programmes and attentional-bias "brain training" have no proven long-term effect on quitting.
- **Craving tools that are justified:** a 3-minute visuospatial block puzzle (Tetris-type; about 14-point drop in craving strength), a 5–10 minute brisk walk or isometric routine (strong acute evidence: SMD −2.03 for desire to smoke), and urge surfing or breathing as low-risk extras. Memory match is justified; Bubble pop is weak and should be reworked or demoted.
- **What to do now:** Before adding more content, build these offline features: (1) a medication decision aid and NRT dosing helper reviewed by a clinician, (2) an on-device "text-message-style" scheduled support programme, (3) a block-puzzle game and a "Move it" activity, (4) before/after craving ratings that learn which tools work for each user, and (5) a self-funded reward pot. Label quitline integration, buddy check-ins, AI coaching, CO monitors and wearables as "coming soon".

## Key Findings

### 1. Evidence ranking: what actually helps people stop smoking

| Rank | Intervention | Best estimate of effect | Certainty / source | What it means for the app |
|---|---|---|---|---|
| 1 | **Varenicline** | OR 2.33 (95% CrI 2.02–2.68) vs control; about 12–16 of 100 quit | High; Cochrane cNMA 2023 (Lindson et al.)\[1\]\[2\] | Promote strongly; needs prescription |
| 1 | **Nicotine e-cigarettes** | OR 2.37 (1.73–3.24) vs control; vs NRT RR 1.51 (1.25–1.82; 9 RCTs, 2,703 people) | High; Cochrane living review (Nov 2025 version)\[1\]\[3\] | Present neutrally where legal; only as a route off cigarettes, not for non-smokers |
| 1 | **Cytisine** | About 10–18 of 100 quit; similar to varenicline\[2\] | High (Cochrane); WHO rates it "moderate" | Show where available (UK, Canada, Eastern Europe); not EMA- or FDA-approved |
| 1 | **Combination NRT** (patch + gum/lozenge/spray) | Similar to varenicline/cytisine/EC; better than single NRT | Additive model, certainty not rated (Cochrane);\[2\]\[4\] WHO lists it as an option | The most accessible "strong" option in Tunisia/MENA, since NRT is over the counter in many places |
| 2 | Single NRT, bupropion | Effective vs placebo, but less effective than the above | High (Cochrane 2023)\[1\]\[4\] | Second-line |
| 2 | **Automated text messaging** | RR 1.54 (1.19–2.00) vs minimal support; RR 1.59 (1.09–2.33) when added to other support | Moderate; Cochrane 2019 (Whittaker)\[5\] | Can be simulated offline with local notifications |
| 2 | **Financial incentives / contingency management** | Cochrane Jan 2025 update (Notley et al.): RR 1.52 (95% CI 1.33–1.74; 39 studies, 18,303 participants; high certainty), up from RR 1.49 in 2019; effect continues after incentives stop (RR 1.46); pregnancy RR 2.13 | High (mixed populations); Cochrane (Notley) | Self-deposit commitment pots had "no clear direction of effect" — useful but not proven on their own |
| 2 | **Implementation intentions (if-then plans)** | OR 1.70 (1.32–2.20); 10.7% vs 4.9% quit | Meta-analysis of 12 studies, substantial heterogeneity (McWilliams 2019, *Health Psychology*)\[6\]\[7\] | Already in the app — keep and deepen |
| 3 | **ACT-based app (iCanQuit)** | OR 1.49 vs NCI QuitGuide; 28.2% vs 21.1% 30-day abstinence at 12 months (self-report); 37 vs 10 app opens | One large RCT (n=2,415; JAMA Intern Med 2020)\[8\]\[9\] | The best evidence that *app content design* matters\[10\] |
| 3 | **Gradual reduction ("cut down to quit")** | Same as abrupt quitting: RR 1.01 (0.87–1.17; 22 RCTs, 9,219 people); vs no treatment RR 1.74 (0.90–3.38), very low certainty | Moderate; Cochrane 2019 | Validates the app's "Cut down slowly" mode, but it must lead to a quit date and works better with fast-acting NRT/varenicline\[11\]\[12\] |
| 4 | Standalone smartphone apps (generic) | RR 1.00 (0.66–1.52) in Cochrane 2019; a 2023 JMIR meta-analysis found OR 1.25 (0.99–1.56), not significant\[13\]\[14\] | Low | Be honest: an app alone is not proven |
| 4 | **Mindfulness-based programmes** | No clear benefit; mindfulness vs matched-intensity treatment RR 0.99 (0.67–1.46) | Low; Cochrane 2022 (21 RCTs, 8,186 people)\[15\]\[16\] | Keep urge surfing as a coping skill, not as a "proven quit method" |
| 4 | Long-term exercise programmes | Do not improve long-term abstinence (e.g., YMCA RCT: 14.1% vs 17.1% at 12 months, n.s.) | Cochrane 2019 (Ussher)\[17\]\[18\] | Use exercise for *acute* cravings, not as a quit claim |
| 5 | Attentional/approach bias modification | No effect on abstinence in a 504-person double-blind web RCT (Wen 2020)\[19\] | Mostly null | Do not market as treatment |

The WHO's first clinical treatment guideline for tobacco cessation (July 2024) agrees with this ranking. It recommends varenicline, NRT, bupropion and cytisine. Varenicline, NRT or bupropion are first-line, combination NRT is an option for people using NRT, and the guideline also endorses brief advice, intensive behavioural support and digital interventions.\[20\]\[21\]

**Interpretation for the product:** FivehunCig's own features (timer, logging, SOS) sit in tiers 3–4 on their own. The app becomes a tier-1/2 intervention by *getting people onto medication and structured support* — a "nudge to treatment" funnel. iCanQuit shows that it is especially effective in people who also use medication: 12-month quit rates were 40% vs 18% among NRT-only users.\[22\] That is the strongest design lever available.

### 2. Cytisine and cytisinicline: availability update (as of October 2026)
- **UK:** licensed as a prescription-only medicine, commercially available since January 2024; NICE added a recommendation in February 2024.\[23\]\[24\]
- **EU:** not centrally approved by the EMA, though it is authorised in several member states. It is approved in about 34 countries overall (mostly Central/Eastern Europe and former Soviet states, plus the UK, Canada and Thailand).\[25\] One secondary source says a French product (Liberostin) has marketing authorisation but is not on the market — **unverified; check with ANSM before stating**.\[26\]
- **WHO:** recommended in the 2024 guideline. Cytisine was then added to the 2025 WHO Model List of Essential Medicines (24th list, released 5 September 2025), under Section 24.5.2, "Medicines for nicotine use disorders", according to the WHO 2025 Expert Committee report and an ASH press release.
- **USA:** FDA issued a Complete Response Letter on 20 June 2026 citing third-party manufacturing (cGMP) observations and unfinished labelling, "no deficiencies regarding the clinical efficacy or safety".\[27\]\[28\] In its Q2 2026 results (SEC 8-K Exhibit 99.1), Achieve Life Sciences says it plans to resubmit in Q4 2026 and "anticipates potential FDA approval in the first half of 2027"; finished-product manufacturing has moved to the US-based Adare Pharma Solutions (this is a company projection).
- **Tunisia/North Africa:** I found no evidence that cytisine is registered. Treat it as "not available, ask your doctor" until a pharmacist or the Ministry confirms.

## Details

### 3. Mini-games and craving activities: evidence and build specifications

**How strong is each tool against an acute craving?**

| Tool | Evidence for reducing an acute craving | Dose | Verdict |
|---|---|---|---|
| Brisk walking / moderate exercise | **Strong**: IPD meta-analysis of 19 acute RCTs; desire to smoke SMD −2.03 (−2.60 to −1.46)\[29\]\[30\] | 5–15 min | Build now (top priority) |
| Isometric exercise (muscle clenching, wall sit) | Included in acute exercise studies; smaller evidence base\[31\] | 2–5 min | Build now (for people who can't walk away) |
| Visuospatial puzzle (Tetris-type) | **Moderate**: in Skorka-Brown et al. (*Addictive Behaviors* 51:165–170, 2015), 3 min of play cut craving strength by a mean 13.9 percentage points (f² = 0.11; 70%→56%) in a week-long real-world study; small sample of undergraduates (15 played Tetris, 16 controls only monitored cravings), not all smokers | 3 min | Build now |
| Memory match (visuospatial working memory) | Plausible by the same mechanism (elaborated-intrusion theory); not directly tested in smokers | 2–3 min | Keep, tune |
| Bubble pop | Low cognitive load → little working-memory competition; no direct evidence | — | Rework or demote |
| Paced breathing (4-4-6) | Low-to-moderate, mostly indirect evidence; low risk | 2–5 min | Keep |
| Urge surfing / curiosity (Brewer) | Promising mechanism; Cochrane finds no long-term quit benefit for mindfulness programmes\[32\] | 3–5 min | Keep as a skill\[33\] |
| Water, chewing gum, fidget objects | Anecdotal / guideline "tips"; no robust trials found | — | Keep as quick tips, no claims |
| Attentional/approach bias "swipe away" training | Null for abstinence (Wen 2020, n=504)\[19\] | — | Don't build as therapy |
| VR cue exposure | Experimental only | — | Coming soon / research only |

**Existing games:** **Memory match is justified** — it loads visuospatial working memory, the same mechanism behind the Tetris findings. Increase difficulty adaptively so it stays demanding, and cap it at 3 minutes. **Bubble pop is weakly justified**; turn it into a *pattern* task (pop bubbles in a shown sequence, or pop only the matching colour as speed increases). That raises working-memory load and gives it a better rationale.

**Eight-plus new game/activity specs, ranked by evidence × ease of build**

1. **"Move it" — 5-minute walk/stairs guide** (evidence: strong; effort: S). Full-screen timer with voice/haptic cues ("walk fast enough to talk but not sing"), optional step count via the device pedometer (Expo `Pedometer`, offline). Measure: craving 0–10 before and after, minutes completed, smoked within 30 min (yes/no).
2. **"Squeeze" — isometric routine for desk/car/home** (evidence: moderate; effort: S). A 3-minute loop: 20 s hand clench, 20 s glute/thigh squeeze, 30 s wall sit or chair push, repeat with rests; animated figure; RTL-ready. Same measures.
3. **"Block Drop" — 3-minute visuospatial block puzzle** (evidence: moderate; effort: M). Falling tetromino-style blocks on a 10×20 grid, swipe/tap rotation, speed rises every 30 s, session hard-stops at 3:00 with a "craving check". Use original shapes and art — "Tetris" is a trademark. Offline in React Native with `react-native-reanimated`/`react-native-skia`. Measure: pre/post craving, lines cleared (engagement), repeat-use rate.
4. **"Vivid Escape" — guided imagery replacement** (evidence: theory-based, elaborated-intrusion research; effort: S). The user picks a scene (beach, family meal, football match) and the app prompts multisensory detail for 2 minutes ("What colours? What sounds?"). Imagery competes with craving imagery. Audio in EN/FR/AR, cacheable.
5. **"Curious Craving" — urge-surf with notes** (evidence: mixed; effort: S). 3-minute audio: notice → name where it is in the body → rate → watch it peak and fall; finish with a "what did smoking actually feel like last time?" reflection (Brewer's disenchantment technique).\[34\]\[35\] Measure: peak and end craving.
6. **"Pattern Pop" — upgraded Bubble pop** (evidence: low–moderate; effort: S). Remember and pop a growing sequence (Simon-style), 2–3 min, adaptive length.
7. **"Spot & Trace"** — spot-the-difference or trace-the-path visuospatial puzzles, 2–3 min (evidence: low–moderate by mechanism; effort: M). Good for smaller screens and older users.
8. **"If-Then Rehearsal" quiz** — 60-second card drill that replays the user's own if-then plans as scenarios ("It's 8 am, coffee is ready — what's your plan?") (evidence: builds on the OR 1.70 implementation-intention evidence; effort: S).
9. **"Delay Ladder"** — turn the existing 5-minute ring into a progression (5 → 7 → 10 min) with streaks tied to the Next Cigarette Timer (evidence: behavioural reasoning, untested; effort: S).
10. **Quick-tip deck** (water, gum, brush teeth, leave the room, change the routine) — no claims, 10 s each (effort: XS).

**Cross-cutting measurement — the single most valuable addition:** at the end of every SOS tool, ask "Craving now? 0–10" and, 30 minutes later, a local notification: "Did you smoke after that craving?" Store results on-device and rank the user's tools by their *personal* average craving drop. Then show "Your best tool: Move it (−4.1 points)". This is offline, private and adaptive, and it gives the owner aggregate evidence later if users opt in.

### 4. Psychological resources and techniques to add to Learn and coaching flows

- **Motivational interviewing for "not ready" users:** use importance/confidence rulers (0–10), "why not lower?" prompts and decisional balance. This suits the "Just watch" mode and the readiness nudge.
- **CBT relapse prevention:** high-risk situation mapping (coffee, alcohol, after meals, stress, driving, social breaks), coping-response rehearsal, and the abstinence-violation effect (already in Slip rescue). Add "lapse ≠ relapse" scripts and a 3-step "What happened / What I'll try next time / Restart now" form.
- **ACT (the iCanQuit model):** values cards ("Why I'm doing this — for my kids"), willingness to feel cravings, defusion ("I'm having the thought that I need a cigarette"). This is the best-evidenced app content style (OR 1.49).\[36\]
- **Habit-loop / cue techniques:** trigger–behaviour–reward mapping (Brewer), routine substitution, cue avoidance early and exposure later.\[37\]
- **Stress and low mood:** quitting is associated with *improved* mental health over time (Cochrane overview). Keep the low-mood safety note and add guidance to see a clinician if mood worsens.
- **Weight gain fears:** be honest — modest weight gain is common. Offer practical tips (snacks, activity) and point out that the health benefit of quitting far outweighs it. *Flag for clinician review before publishing specific kg figures.*
- **Alcohol and coffee:** alcohol is a classic lapse trigger, so build if-then plans for social drinking. Caffeine levels can rise after quitting (smoking speeds caffeine metabolism), so suggest cutting coffee if users feel jittery. *Flag for clinician review.*
- **Ramadan as a quit window:** Qatar's Hamad Medical Corporation Tobacco Control Center explicitly promotes Ramadan as a time to quit.\[38\] A Ramadan mode (suhoor/iftar triggers) is a strong culturally specific feature for Arabic/French-speaking Maghreb users.

**Free, reputable programmes to link to (link-out):**
- **Smokefree.gov (US NCI):** QuitGuide app, SmokefreeTXT, quit plans — CBT/USCPG skills.
- **NHS Better Health Quit Smoking (UK):** personal quit plan, NHS Quit Smoking app, NRT guidance page with embedded video — https://www.nhs.uk/better-health/quit-smoking/ready-to-quit-smoking/quit-with-nicotine-replacement-therapies-nrt/ \[39\]\[40\]
- **Truth Initiative "This is Quitting"** (vaping/young adults; text-based).
- **Dr Judson Brewer's Craving to Quit** (mindfulness; paid app, with the free TED talk below).
- **WHO:** 2024 clinical treatment guideline; WHO quitting toolkits and mCessation ("Be He@lthy, Be Mobile").\[41\]
- **Tabac Info Service (France, Santé publique France):** coaching app, 39 89 line (French).
- **Tunisia arretabac.tn** (Ministry of Health): list of quit clinics at basic health centres (CSB);\[42\] free "YAKFI" text-message programme (text YAKFI to 85355, as reported by the subagent's search — verify before publishing).\[43\]

### 5. Medical resources (all wording here needs clinician review before shipping)

- **NRT:** safe for most adults. Combination NRT (patch + fast-acting) is more effective than one form alone.\[4\]\[44\] The common mistake is under-dosing — teach users to use fast-acting NRT for breakthrough cravings. People with recent heart attack/stroke, pregnancy or under 18 should ask a professional first.
- **Varenicline:** prescription; nausea and vivid dreams are common. Neuropsychiatric safety was reassuring in large trials, but advise contacting a doctor if mood changes.
- **Cytisine:** prescription where licensed; short (25-day) course started while still smoking;\[23\] similar efficacy to varenicline in Cochrane.\[4\] The WHO essential-medicines review notes it is not prescribed under 18 or over 65 in labelling.\[45\]
- **Bupropion:** prescription; seizure risk — contraindicated with seizure history and eating disorders.\[4\]
- **E-cigarettes:** Cochrane rates them high-certainty as more effective than NRT for adult smokers. Most guidelines (and WHO) are more cautious; legality varies by country (restricted or banned in several MENA states).\[3\]\[46\] Present facts neutrally and never to non-smokers or minors.
- **Withdrawal timeline:** cravings and irritability peak in the first days to week and fade over 2–4 weeks; occasional cue-triggered cravings can last months.\[47\]\[48\] *Clinician review.*
- **Health recovery timeline:** keep the WHO timeline already in Progress; avoid personalised medical predictions.
- **When to see a doctor:** chest pain, worsening mood or suicidal thoughts, pregnancy, serious heart/lung disease, epilepsy, or psychiatric medicines (smoking cessation changes the blood levels of some drugs, e.g., clozapine, olanzapine — *clinician review*).

**Help resources by region**

| Region | Resource | Status in this research |
|---|---|---|
| **Tunisia** | Ministry of Health quit clinics at CSBs (e.g., Grand Tunis list on arretabac.tn); hospital clinics since 2009 (e.g., CHU Sahloul, Sousse); **Institut Salah Azaïez (Tunis)** consultations every Tuesday from 25 Aug 2026, by appointment, with free patches supplied via the Ministry; ISST publishes the national clinic list\[42\]\[49\]\[50\]\[51\]\[52\]\[53\] | Verified via news and official snippets; no national phone quitline found |
| Tunisia burden | More than 13,200 Tunisians die from tobacco each year (about 20% of all deaths; 49% before age 70), per the 2021 UNDP/WHO/FCTC Secretariat investment case for Tunisia; La Presse (20 Jul 2026) reports male smoking prevalence of 49.5% | The 20.5% overall prevalence figure seen in press could not be sourced — treat as unverified |
| Saudi Arabia | MOH 937; free clinics, Mawid app\[54\]\[55\] | Subagent found via search; not opened |
| Qatar | HMC Tobacco Control Center 4025 4981 / WhatsApp 5080 0959 | Subagent found via search (HMC page, Mar 2025)\[38\]\[56\] |
| UAE | MOHAP 800 11111; clinic list; SEHA 80050 (Abu Dhabi)\[57\]\[58\]\[59\] | Subagent found via search; general lines, not dedicated quitlines |
| Egypt | MOH hotline 105\[60\]\[61\] | News-only; verify |
| Morocco | Lalla Salma Foundation list of quit centres (no national quitline found)\[62\]\[63\] | Subagent found via search |
| France | Tabac Info Service 39 89 | Well known; not re-verified in this research |
| USA | 1-800-QUIT-NOW; Smokefree.gov | Well known; not re-verified |
| Canada | 1-866-366-3667 | Well known; not re-verified |
| UK | NHS Better Health / local Stop Smoking Services; the old national helpline may have been withdrawn | Verify before publishing |
| Global | WHO FCTC; WHO 2024 cessation guideline; WHO mCessation | Verified |

### 6. Real videos (verification level stated honestly)

| Title | Publisher / channel | URL | Length | Language | Fits screen |
|---|---|---|---|---|---|
| A simple way to break a bad habit | Judson Brewer, TEDMED 2015 | https://www.ted.com/talks/judson_brewer_a_simple_way_to_break_a_bad_habit | ~10 min\[34\]\[64\] | EN (TED offers subtitles in many languages) | SOS → Urge surfing; Learn |
| Tips From Former Smokers — video library (dozens of testimonials, incl. Beatrice's trigger-management story) | CDC | https://www.cdc.gov/tobacco/campaign/tips/resources/videos/index.html \[65\] | Various (30 s ads to multi-min stories) | EN (Spanish pages available) | Reasons wall; Readiness nudge |
| Terrie H.: Don't Smoke Ad | CDC (YouTube) | https://www.youtube.com/watch?v=OFQ6YoDAoeY \[66\]\[67\] | ~30 s | EN | Reasons wall (use with care — fear content) |
| Terrie H.'s Tip Ad | CDC (YouTube) | https://www.youtube.com/watch?v=5zWB4dLYChM | ~30 s\[68\]\[69\] | EN | Reasons wall |
| Terrie: "Terrie, What Are You Doing?" | CDC (YouTube) | https://www.youtube.com/watch?v=dQIbIpjWEmc | 2 min 7 s\[70\] | EN | Slip rescue / motivation |
| Terrie's Ad: Consequences of Smoking (record a lullaby tip) | CDC (YouTube) | https://www.youtube.com/watch?v=EyVLKHEqTu0 \[71\] | short | EN | Reasons wall |
| NHS "Quit with NRT" page (embedded video on NRT types, combining, cravings) | NHS Better Health | https://www.nhs.uk/better-health/quit-smoking/ready-to-quit-smoking/quit-with-nicotine-replacement-therapies-nrt/ \[39\] | short | EN | Get help → NRT |
| Patchs anti-tabac : la solution pour arrêter de fumer ? | Hospices Civils de Lyon (HCL) | https://www.youtube.com/watch?v=LuSsMEh4T-M \[72\] | ~4 min | FR | Get help → NRT (FR) — reopen once to confirm ID |
| Mois sans tabac : Les substituts nicotiniques 1/5 (series to 5/5) | CHU Amiens tobacco specialist | https://www.youtube.com/watch?v=Cym_TM5UiR4 \[73\] | — | FR | Get help → NRT (FR) — seen in search only; verify |
| الإقلاع عن التدخين.. يبدأ بتقييم الإدمان وخطة علاجية | Features Madinah Health Cluster tobacco-control coordinator (Saudi) | https://www.youtube.com/watch?v=Hv4NfRf_LD8 \[74\] | — | AR | Get help (AR) — channel unconfirmed; verify |
| Arrêt du tabac : se faire accompagner et substituts nicotiniques | AFP (news) | https://www.youtube.com/watch?v=NEtMRb3Os9s | 0:47\[75\] | FR | Learn — dated (2014); use only if nothing better |

**Gap:** I could not verify an official WHO EMRO, Tabac Info Service or Hamad Medical Corporation video URL. The WHO EMRO Arabic campaign-materials page (emro.who.int/ar/tfi-campaigns/2019/campaign-materials.html) returned an error when fetched. Commission a native Arabic and French reviewer to curate 3–5 official videos per language before launch.

## Recommendations

### Top-10 prioritised action list
1. **Treatment decision aid + "Get the strongest help" funnel** (Get help screen; impact: very high, tier 1 evidence; effort M). A short quiz (country, pregnancy, heart disease, preferences) leads to options ranked by the Cochrane/WHO evidence, with a "talk to your pharmacist/doctor" script in EN/FR/AR. Show the iCanQuit finding that app + medication beats app alone.
2. **Combination-NRT helper** (Get help; high; M): which patch strength by cigarettes/day, plus fast-acting doses for cravings, with reminders. *Must be clinician-reviewed.*
3. **On-device "SMS-style" support programme** (notifications; impact high — text messaging RR 1.54; effort M). 6–12 weeks of scheduled, tailored local notifications around the quit date, written in all three languages; no server required.
4. **"Move it" + "Squeeze" activities in Craving SOS** (high for acute cravings; S).
5. **"Block Drop" 3-minute puzzle; upgrade Bubble pop to "Pattern Pop"** (moderate; M).
6. **Personal "what works for me" engine** (pre/post craving ratings + 30-min follow-up; high value; S–M).
7. **Turn "Cut down slowly" into "Cut down *to quit*"** (Progress/Timer; moderate–high; S). Prompt for a quit date after 4–8 weeks of reduction, and suggest fast-acting NRT during reduction — Cochrane found reduction works better with pharmacotherapy.\[11\]
8. **ACT/MI content rewrite of Learn and Reasons** (values, willingness, rulers; moderate; M).
9. **Self-funded reward pot (offline)** (Progress; moderate; S). Users "deposit" the money they don't spend on cigarettes toward a named reward. Real deposit contracts stay "coming soon" because the self-deposit evidence is unclear and they need payment infrastructure.\[76\]
10. **Localised help directory + Ramadan mode** (Get help; moderate; S). Tunisia CSB/ISST/Salah Azaïez, YAKFI SMS, Gulf/Egypt/Morocco resources, with a "last verified" date on each entry.

### Build now vs coming soon

| Item | Status | Expected impact (evidence) | Effort | Screen |
|---|---|---|---|---|
| Decision aid, NRT helper, help directory | NOW | High (tier 1 via referral) | M | Get help |
| Local-notification support programme | NOW | High (RR 1.54 for SMS) | M | Background / Home |
| Move it, Squeeze, Block Drop, Pattern Pop, Vivid Escape | NOW | Moderate (acute craving) | S–M | Craving SOS |
| Craving rating + personal ranking | NOW | Enables personalisation | S | SOS / Progress |
| If-Then rehearsal quiz, Delay ladder | NOW | Moderate (OR 1.70 for II) | S | Plans / SOS |
| Cut-down-to-quit pathway | NOW | Moderate | S | Modes / Timer |
| Self-funded reward pot | NOW | Low–moderate | S | Progress |
| Quitline click-to-call / telehealth referral | COMING SOON (needs partners) | High (counselling is WHO-recommended) | M–L | Get help\[77\] |
| Buddy check-in, community moderation | COMING SOON | Uncertain | L | Community |
| AI coach | COMING SOON | Unproven; needs safety guardrails | L | Chat |
| Deposit/commitment contracts with refunds | COMING SOON | Incentives RR ~1.5 (needs verification, e.g., CO) | L | Progress |
| CO breath monitor pairing | COMING SOON | Enables verified incentives | L | Progress |
| Smartwatch smoking detection, craving forecast | COMING SOON | Experimental | L | Home |
| VR cue exposure | COMING SOON / research | Experimental | XL | — |
| Partner pharmacies (NRT vouchers) | COMING SOON | High if it increases NRT use | L | Get help |

### Safe video integration
- **Prefer link-out or the official embed player** (YouTube IFrame via `react-native-youtube-iframe`, TED embed via embed.ted.com). Embeds respect publisher terms and keep view counts. Do not download or re-host YouTube files — that breaches YouTube's Terms of Service.
- **Offline:** cache only *your own* or licensed content. CDC videos are US-government works (generally public domain — confirm per video) and could be bundled. Store thumbnails, titles and transcripts/summaries offline so the Learn card still teaches without a connection.
- Add a **"may be distressing" label** on fear-based testimonials (Tips). Let users choose "hopeful stories only" — consistent with a no-shaming design.
- Keep a **link-health check** in each release, plus a remotely updatable JSON list later (once a backend exists).

### Learn content plan (EN/FR/AR)
Write 12 core cards, each 150–250 words, in all three languages, reviewed by a native-speaking clinician:
1. How nicotine addiction works
2. Your medication options (ranked)
3. Using combination NRT correctly
4. Cytisine/varenicline — what to ask your doctor
5. E-cigarettes: facts and local law
6. The first 2 weeks: withdrawal
7. Coffee, alcohol and meals as triggers
8. Stress and mood
9. Weight worries
10. Slips are part of quitting
11. Ramadan and quitting
12. Cutting down to quit

Add a "Where to get help in your country" card. Arabic needs RTL layouts and Maghreb-friendly wording (consider Tunisian Darija audio for the SOS tools).

## Caveats and compliance

- **Avoid medical claims.** Say "people who use X are more likely to quit" and cite the source. Never say "FivehunCig helps you quit" — standalone apps are unproven (Cochrane RR 1.00).\[13\] No cure, guarantee or success-rate claims for the app itself.
- **App store rules:** Apple's App Review Guidelines (Safety section 1.4, physical harm) scrutinise health and medical apps for accuracy and data practices. Google Play requires a Health apps declaration and accurate health claims. Dosing guidance raises the regulatory risk — keep it as general information that defers to a pharmacist/doctor. Under the EU MDR or FDA, functions that calculate doses or diagnose could make the app a medical device. *Get regulatory advice before shipping the NRT helper.*
- **E-cigarette content** may breach store or national rules in some MENA countries — geo-tailor it or keep it purely informational.
- **Evidence limits:** the Tetris data come from small undergraduate samples. Acute exercise studies measure short-term craving, not quitting. The implementation-intention meta-analysis is heterogeneous. The newest Cochrane e-cigarette estimate differs between versions: RR 1.51 in the Nov 2025 version, and RR 1.61 (1.23–2.12; 11 RCTs, 4,114 people; high certainty) for nicotine EC vs NRT in the 2026 living-review update (Lindson et al., CD010216.pub11; 80 RCTs, 29,861 participants; evidence current to 1 January 2026). Cite the version you checked.
- **Ethics:** no shaming, no streak-loss punishment, no fear-only messaging. Make slips a learning moment. Keep the low-mood safety note and add crisis lines per country. Never push nicotine products to non-smokers or minors. Keep the "offline, no tracking" promise if you add analytics — opt-in only.
- **Items needing clinician review:** all dosing text, withdrawal and weight figures, caffeine/psychiatric-drug interactions, cytisine age limits, pregnancy guidance and the e-cigarette wording.
- **Unverified items to confirm before publishing:** France 39 89, US/Canada quitline numbers, UK helpline status, Egypt 105, Saudi 937, the YAKFI SMS number, the French cytisine authorisation, and the French/Arabic video URLs marked "verify".

## Sources

1. [Pharmacological and electronic cigarette interventions for smoking cessation in adults: component network meta-analyses - PubMed](https://pubmed.ncbi.nlm.nih.gov/37696529/)
2. [How effective are medications and e-cigarettes for quitting smoking, and what works best?](https://www.cochrane.org/evidence/CD015226_how-effective-are-medications-and-e-cigarettes-quitting-smoking-and-what-works-best)
3. [Electronic cigarettes for smoking cessation - Lindson, N - 2025](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD010216.pub10/full)
4. [Pharmacological and electronic cigarette interventions for smoking cessation in adults: component network meta‐analyses - Lindson, N - 2023](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD015226.pub2/full)
5. [Mobile phone text messaging and app‐based interventions for smoking cessation - Whittaker, R - 2019](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD006611.pub5/full)
6. [Beyond "planning": A meta-analysis of implementation intentions to support smoking cessation - PubMed](https://pubmed.ncbi.nlm.nih.gov/31414843)
7. [Beyond “Planning” : Health Psychology](https://www.ovid.com/journals/hepsy/abstract/10.1037/hea0000768~beyond-planning-a-meta-analysis-of-implementation-intentions?redirectionsource=fulltextview)
8. [Smoking Cessation App That Teaches Acceptance Shows Promise](https://psychiatryonline.org/doi/10.1176/appi.pn.2020.11a6)
9. [Efficacy of Smartphone Applications for Smoking Cessation: A Randomized Clinical Trial](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2770816)
10. [New research from Fred Hutch shows that an app can dramatically help smokers quit](https://www.geekwire.com/2020/new-research-fred-hutch-shows-app-can-dramatically-help-smokers-quit/)
11. [Smoking reduction interventions for smoking cessation - PubMed](https://pubmed.ncbi.nlm.nih.gov/31565800/)
12. [Effects of interventions to combat tobacco addiction: Cochrane update of 2019 and 2020 reviews - Livingstone‐Banks - 2022 - Addiction - Wiley Online Library](https://onlinelibrary.wiley.com/doi/10.1111/add.15769)
13. [Journal of Medical Internet Research - Smartphone Apps for Smoking Cessation: Systematic Framework for App Review and Analysis](https://www.jmir.org/2023/1/e45183)
14. [Journal of Medical Internet Research - The Effectiveness of Smartphone App–Based Interventions for Assisting Smoking Cessation: Systematic Review and Meta-analysis](https://www.jmir.org/2023/1/e43242)
15. [禁煙のためのマインドフルネス - Jackson, S - 2022](https://www.cochranelibrary.com/web/cochrane/content?templateType=full&urlTitle=%2Fcdsr%2Fdoi%2F10.1002%2F14651858.CD013696.pub2&doi=10.1002%2F14651858.CD013696.pub2&type=cdsr&contentLanguage=ja)
16. [Can mindfulness help people to stop smoking?](https://www.cochrane.org/evidence/CD013696_can-mindfulness-help-people-stop-smoking)
17. [Exercise interventions for smoking cessation - PMC - NIH](https://pmc.ncbi.nlm.nih.gov/articles/PMC6819982/)
18. [The Efficacy of Individualized, Community-Based Physical Activity to Aid Smoking Cessation: A Randomized Controlled Trial - PubMed](https://pubmed.ncbi.nlm.nih.gov/37273658/)
19. [JMIR Mental Health - Combining Web-Based Attentional Bias Modification and Approach Bias Modification as a Self-Help Smoking Intervention for Adult Smokers Seeking Online Help: Double-Blind Randomized Controlled Trial](https://mental.jmir.org/2020/5/e16342/tweetations)
20. [Executive summary - WHO clinical treatment guideline for tobacco cessation in adults - NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/n/who377825/fm-ch2/)
21. [WHO Releases First Global Tobacco Cessation Guidelines](https://respiratory-therapy.com/public-health/smoking/tobacco/who-releases-first-global-tobacco-cessation-guidelines/)
22. [Do medications increase the efficacy of digital interventions for smoking cessation? Secondary results from the iCanQuit randomized trial - Bricker - 2024 - Addiction - Wiley Online Library](https://onlinelibrary.wiley.com/doi/abs/10.1111/add.16396)
23. [APPLICATION FOR THE INCLUSION OF CYTISINE ON THE WHO MODEL LIST OF ESSENTIAL](https://cdn.who.int/media/docs/default-source/2025-eml-expert-committee/addition-of-new-medicines/a.8_cytisine.pdf?sfvrsn=5df4226_6)
24. [Smoking Cessation Aid Cytisinicline Could Soon Get FDA Approval](https://www.forbes.com/sites/joshuacohen/2025/07/05/smoking-cessation-aid-cytisinicline-could-soon-get-fda-approval/)
25. [Cytisine was added to WHO's list of essential medicines, but much remains to be done](https://profetter.substack.com/p/who-just-added-cytisine-to-the-list)
26. [Cytisine to stop smoking - Help to stop smoking](https://stop2smoke.net/cytisine/)
27. [ACHIEVE LIFE SCIENCES, INC. - Form 8-K - FY2026](https://www.sec.gov/Archives/edgar/data/0000949858/000119312526344571/achv-ex99_1.htm)
28. [MAESTrO: Achieve Life Sciences receives complete response letter from FDA for cytisinicline NDA](https://maestrodatabase.com/blog/achieve-life-sciences-receives-complete-response-letter-from-fda-for-cytisinicline-nda)
29. [The acute effects of physical activity on cigarette cravings: Exploration of potential moderators, mediators and physical activity attributes using individual participant data (IPD) meta-analyses](https://link.springer.com/article/10.1007/s00213-014-3450-4)
30. [The acute effects of physical activity on cigarette cravings: Systematic review and meta-analysis with individual participant data](https://uwe-repository.worktribe.com/index.php/output/936119/the-acute-effects-of-physical-activity-on-cigarette-cravings-systematic-review-and-meta-analysis-with-individual-participant-data)
31. [The Efficacy of Individualized, Community-Based Physical Activity to Aid Smoking Cessation: A Randomized Controlled Trial](https://www.cambridge.org/core/journals/journal-of-smoking-cessation/article/efficacy-of-individualized-communitybased-physical-activity-to-aid-smoking-cessation-a-randomized-controlled-trial/B4F21C78245315AACE5D7841714D233A)
32. [Mindfulness for smoking cessation - Jackson, S - 2022](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013696.pub2/full)
33. [A simple way to break a bad habit](https://glasp.co/youtube/p/a-simple-way-to-break-a-bad-habit-judson-brewer-ted)
34. [Judson Brewer: A simple way to break a bad habit](https://www.ted.com/talks/judson_brewer_a_simple_way_to_break_a_bad_habit)
35. [A Simple Way to Break a Bad Habit: Dr. Jud Brewer (TED)](https://drjud.com/a-simple-way-to-break-a-bad-habit/)
36. [Quitting smoking apps that help you acknowledge your triggers work better, study shows](https://www.cnn.com/2020/09/21/health/quit-smoking-app-study-wellness)
37. [TED Talk "Simple Way to Break a Bad Habit" by Judson Brewer](https://m.youtube.com/watch?v=mJ57uw8MHbQ)
38. [HMC’s Tobacco Control Center Encourages Smokers to Take Advantage of Ramadan to Permanently Quit Smoking](https://www.hamad.qa/EN/news/2025/March/Pages/Tobacco-Control-Center-Encourages-Smokers-to-Take-Advantage-of-Ramadan-to-Permanently-Quit-Smoking.aspx)
39. [Quit smoking with nicotine replacement therapies (NRTs) - Better Health - NHS](https://www.nhs.uk/better-health/quit-smoking/ready-to-quit-smoking/quit-with-nicotine-replacement-therapies-nrt/)
40. [Better Health Smoke Free (always on)](https://campaignresources.dhsc.gov.uk/campaigns/better-health-quit-smoking/)
41. [mCessation](http://www.arretabac.tn/mcessation)
42. [Adresses et liens](http://www.arretabac.tn/adresses-et-liens)
43. [Arretabac.tn](http://www.arretabac.tn/)
44. [Tobacco Cessation: WHO 2024 Guideline Summary](https://reference.medscape.com/cc2/p10/who-clinical-guideline-tobacco-cessation-adults-2024a1000kj1)
45. [25th WHO Expert Committee on Selection and Use of Essential Medicines](https://cdn.who.int/media/docs/default-source/2025-eml-expert-committee/expert-reviews/a.8_cytisine_review2.pdf?sfvrsn=ecfb97d0_1)
46. [وزارة الصحة تحسم الجدل: «الفيب» ليس وسيلة للإقلاع عن التدخين - اليوم السابع](https://www.youm7.com/story/2026/6/23/%D9%88%D8%B2%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%B5%D8%AD%D8%A9-%D8%AA%D8%AD%D8%B3%D9%85-%D8%A7%D9%84%D8%AC%D8%AF%D9%84-%C2%AB%D8%A7%D9%84%D9%81%D9%8A%D8%A8%C2%BB-%D9%84%D9%8A%D8%B3-%D9%88%D8%B3%D9%8A%D9%84%D8%A9-%D9%84%D9%84%D8%A5%D9%82%D9%84%D8%A7%D8%B9-%D8%B9%D9%86-%D8%A7%D9%84%D8%AA%D8%AF%D8%AE%D9%8A%D9%86/7449117)
47. [How to stop smoking](https://www.nhsinform.scot/healthy-living/how-to-stop-smoking/)
48. [Smoking](https://shc.gov.sa/en/HealthKnowledge/Pages/Smoking.aspx)
49. [Profil clinique des fumeurs à la consultation d’aide au sevrage tabagique (Centre hospitalier universitaire de Sousse, Tunisie) - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0761842513010188)
50. [Sevrage tabagique : Salah Azaiz mise sur la prévention plutôt que la sanction - La Presse de Tunisie](https://www.lapresse.tn/2026/09/07/sevrage-tabagique-salah-azaiz-mise-sur-la-prevention-plutot-que-la-sanction)
51. [Sevrage tabagique : des consultations d'aide à l'Institut Salah Azaïez - Le Temps News](https://letemps.news/2026/08/21/sevrage-tabagique-des-consultations-daide-a-linstitut-salah-azaiez/)
52. [Les consultations de sevrage tabagique](https://www.isst.nat.tn/fr/article/les-consultations-de-sevrage-tabagique)
53. [L’Institut Salah Azaïez lance des consultations pour aider à arrêter de fumer - webdo](https://www.webdo.tn/fr/actualite/national/linstitut-salah-azaiez-lance-des-consultations-pour-aider-a-arreter-de-fumer/402719/)
54. [Introduction](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2025.1608394/xml)
55. [WHO EMRO - Saudi Arabia: offering help to quit tobacco use](https://www.emro.who.int/tfi/news/saudi-arabia-offering-help-to-quit-tobacco-use.html)
56. [HMC Tobacco Control Center Services offer path to smoke-free life](https://thepeninsulaqatar.com/article/24/11/2024/hmc-tobacco-control-center-services-offer-pathto-smoke-free-life)
57. [Together Toward A Tobacco Free Abu Dhabi](https://www.adphc.gov.ae/en/Public-Health-Programs/Together-Toward-A-Tobacco-Free-Abu-Dhabi)
58. [Smoking Cessation Clinics](https://mohap.gov.ae/en/about-us/whats-new-in-mohap/smoking-cessation-clinics)
59. [UAE Helplines & Emergency Numbers (2026)](https://adad.ae/blog/uae-helplines-emergency-numbers-2025-guide)
60. [الصحة تحذر: استبدال السجائر بـ«الڤيب» لا يعني التخلص من الاعتماد على النيكوتين](https://www.mobtada.com/egypt/1645600/%D8%A7%D9%84%D8%B5%D8%AD%D8%A9-%D8%AA%D8%AD%D8%B0%D8%B1-%D8%A7%D8%B3%D8%AA%D8%A8%D8%AF%D8%A7%D9%84-%D8%A7%D9%84%D8%B3%D8%AC%D8%A7%D8%A6%D8%B1-%D8%A8%D9%80%D8%A7%D9%84%DA%A4%D9%8A%D8%A8-%D9%84%D8%A7-%D9%8A%D8%B9%D9%86%D9%8A-%D8%A7%D9%84%D8%AA%D8%AE%D9%84%D8%B5-%D9%85%D9%86-%D8%A7%D9%84%D8%A7%D8%B9%D8%AA%D9%85%D8%A7%D8%AF-%D8%B9%D9%84%D9%89-%D8%A7%D9%84%D9%86%D9%8A%D9%83%D9%88%D8%AA%D9%8A%D9%86)
61. [الصحة: السجائر الإلكترونية ليست وسيلة للإقلاع عن التدخين](https://www.mobtada.com/misc/1622435/%D8%A7%D9%84%D8%B5%D8%AD%D8%A9-%D8%A7%D9%84%D8%B3%D8%AC%D8%A7%D8%A6%D8%B1-%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A%D8%A9-%D9%84%D9%8A%D8%B3%D8%AA-%D9%88%D8%B3%D9%8A%D9%84%D8%A9-%D9%84%D9%84%D8%A5%D9%82%D9%84%D8%A7%D8%B9-%D8%B9%D9%86-%D8%A7%D9%84%D8%AA%D8%AF%D8%AE%D9%8A%D9%86)
62. [1 Royaume du Maroc Ministère de la Santé Direction de la Population](https://www.contrelecancer.ma/site_media/uploaded_files/Liste_des_centres_d_aide_au_sevrage_tabagique.pdf)
63. [Centres de Sevrage tabagique](https://www.contrelecancer.ma/fr/centers_de_sevrage_tabagique)
64. [A Simple Way to Break a Bad Habit - Women Together](https://womentogether.com/lifenotes/video/simple-way-break-bad-habit/)
65. [cdc.gov](https://cdc.gov/tobacco/campaign/tips/resources/videos/index.html)
66. [Show content](https://digitalmedia.hhs.gov/storefront/showContent/12551)
67. [CDC: Tips From Former Smokers - Terrie H.: Don’t Smoke Ad - YouTube](https://www.youtube.com/watch?v=OFQ6YoDAoeY)
68. [CDC: Tips From Former Smokers - Terrie's Ad](https://dcmp.org/media/8030-cdc-tips-from-former-smokers-terrie-s-ad?nm=1)
69. [CDC: Tips From Former Smokers - Terrie H.’s Tip Ad - YouTube](https://www.youtube.com/watch?v=5zWB4dLYChM)
70. [File:CDC- Tips From Former Smokers - Terrie- "Terrie, What Are You Doing.".webm - Wikimedia Commons](https://commons.wikimedia.org/wiki/File:CDC-_Tips_From_Former_Smokers_-_Terrie-_%22Terrie,_What_Are_You_Doing.%22.webm)
71. [CDC: Tips from Former Smokers - Terrie's Ad: Consequences of Smoking](https://digitalmedia.hhs.gov/storefront/showContent/8983)
72. [Patchs anti-tabac : la solution pour arrêter de fumer ?](https://www.youtube.com/watch?v=LuSsMEh4T-M)
73. [Mois sans tabac : Les substituts nicotiniques 1/5 - YouTube](https://www.youtube.com/watch?v=Cym_TM5UiR4)
74. [الإقلاع عن التدخين.. يبدأ بتقييم الإدمان وخطة علاجية - YouTube](https://www.youtube.com/watch?v=Hv4NfRf_LD8)
75. [Arrêt du tabac: se faire accompagner et substituts nicotiniques](https://www.youtube.com/watch?v=NEtMRb3Os9s)
76. [Nuffield Department of Primary Care Health Sciences](https://www.phc.ox.ac.uk/publication/1033375)
77. [WHO Releases 2024 Smoking Cessation Guidelines: A Milestone in Global Tobacco Control - NGU Solutions](https://ngusolutions.org/2026/02/07/who-releases-2024-smoking-cessation-guidelines-a-milestone-in-global-tobacco-control/)
