# Voice recording script

The voice of **Mahla** (مهلة), the app's guide. Spoken versions of Mahla's lines and of the cues in Walk, Squeeze and Breathe. With a voice, people can follow a tool with the phone in their pocket.

- **29 short clips per language, 87 in all.** Each takes 1–6 seconds.
- **Plan about 45 minutes per language.** That includes retakes.
- **The texts are the app's own texts.** If a line changes in the app, change it here too.

---

## 1. How to record

**Equipment.** A phone's voice-memo app is enough. Turn on airplane mode so no call or notification sound gets into a take.

**Room.**
- Pick a small room with soft things in it: a bedroom, or even in front of an open wardrobe full of clothes.
- Avoid bathrooms, kitchens and empty rooms, because they echo.
- Switch off fans, the fridge if you can, and the TV.

**Position.** Hold the phone 20–30 cm from your mouth, a little to the side, so your breath doesn't hit the microphone.

**Voice.**
- Talk like a friend sitting next to someone who is having a hard moment. Be calm, warm and a little slow, and smile slightly while you talk; it can be heard.
- Don't act and don't "announce". Never sound like a coach or a doctor.
- Keep the same distance and the same volume for all clips.

**Each clip:**
1. Leave 1 second of silence.
2. Say the line.
3. Leave 1 second of silence.
4. Record **2 takes**. If you stumble, just say the line again in the same file. I'll cut the best take.

**Length.** Stay under the time given for each clip. The Breathe words must be very short, because they play inside 4–6 second breaths.

**Files.**
- Save in WAV or M4A, whatever the app gives you.
- Name each file by its **ID**, for example `guide-before-1.m4a`.
- Use one folder per language: `en/`, `fr/`, `ar/`.

When you're done, put the three folders in `assets/voice/` in the project, or send them to me another way. I'll trim them, convert them to small mono files (about 3 MB for all 87), and connect them to the app.

**If someone else records:** get their written OK to use their voice in the app, and keep it.

**What I still need to build afterwards:**
- Playing the clips. The app already has the sound player used for the game sounds, so no new library is needed.
- A "Voice" switch in Settings next to the sound switches.
- Following the phone's silent mode, like the other sounds.

---

## 2. Clip list

**Guide lines.** These play when the guide's line changes in any tool.
- The three `guide-before` lines are variants; the app picks one.
- The same goes for `-1` / `-2` in the other groups.

**Reasons.** The app can't speak the member's own reason, because it's their text. When the guide shows "Remember why: *their reason*", it plays the general line `guide-reason`, which is a new line. I'd change the on-screen text to match.

### English (`en/`)

| ID | Line | Max |
|---|---|---|
| guide-before-1 | I'm here with you. Let's get through the next few minutes together. | 5 s |
| guide-before-2 | Cravings come in waves. Let's ride this one out together. | 5 s |
| guide-before-3 | You opened this instead of a pack. That already counts. | 5 s |
| guide-start-1 | Good start. Keep going, I'm right here. | 4 s |
| guide-start-2 | Nice. Just this minute, nothing else. | 4 s |
| guide-half-1 | Halfway there. You're doing it. | 3 s |
| guide-half-2 | Look at you. Halfway already. | 3 s |
| guide-end-1 | Almost done. Stay with me. | 3 s |
| guide-end-2 | Last stretch. You've got this. | 3 s |
| guide-after-1 | You finished. That's a real step. | 3 s |
| guide-after-2 | Done. Take a breath, you earned it. | 3 s |
| guide-ended-early | Stopping early is fine. You still gave yourself a few minutes. | 5 s |
| guide-best | This one works well for you: your craving dropped the most with it. | 5 s |
| guide-reason | Remember why you started. *(new line)* | 3 s |
| walk-start | Head out and find a brisk, steady pace. | 4 s |
| walk-pace | Fast enough to talk, not to sing. | 3 s |
| walk-arms | Swing your arms. Breathe out a little longer than you breathe in. | 5 s |
| walk-halfway | Halfway. Notice what the craving is doing now. | 4 s |
| walk-last | Last minute. Keep the pace to the end. | 4 s |
| walk-done | Five minutes done. Well walked. | 3 s |
| squeeze-hands | Clench your fists. Squeeze both hands as hard as is comfortable. | 5 s |
| squeeze-legs | Squeeze legs and seat. Tighten your thighs and buttocks. Keep breathing. | 6 s |
| squeeze-push | Push. Press your palms together, or push down on the seat with your hands. | 6 s |
| squeeze-rest | Let go and rest. | 2 s |
| squeeze-done | Three minutes done. | 2 s |
| breathe-in | Breathe in. | 1.5 s |
| breathe-hold | Hold. | 1 s |
| breathe-out | Breathe out. | 1.5 s |
| breathe-done | Well done. | 1.5 s |

### Français (`fr/`)

| ID | Texte | Max |
|---|---|---|
| guide-before-1 | Je suis là avec vous. Passons ces quelques minutes ensemble. | 5 s |
| guide-before-2 | Les envies viennent par vagues. Laissons passer celle-ci ensemble. | 5 s |
| guide-before-3 | Vous avez ouvert ceci au lieu d'un paquet. Ça compte déjà. | 5 s |
| guide-start-1 | Bon début. Continuez, je suis là. | 4 s |
| guide-start-2 | Bien. Juste cette minute, rien d'autre. | 4 s |
| guide-half-1 | À mi-chemin. Vous y arrivez. | 3 s |
| guide-half-2 | Regardez-vous : déjà la moitié. | 3 s |
| guide-end-1 | Presque fini. Restez avec moi. | 3 s |
| guide-end-2 | Dernière ligne droite. Vous y êtes presque. | 3 s |
| guide-after-1 | C'est fini. C'est un vrai pas. | 3 s |
| guide-after-2 | Terminé. Respirez, vous l'avez mérité. | 3 s |
| guide-ended-early | Arrêter plus tôt, ce n'est pas grave. Vous vous êtes quand même accordé quelques minutes. | 6 s |
| guide-best | Celui-ci vous réussit : c'est avec lui que votre envie a le plus baissé. | 5 s |
| guide-reason | Rappelez-vous pourquoi vous avez commencé. *(nouvelle ligne)* | 3 s |
| walk-start | Allez-y et trouvez un pas rapide et régulier. | 4 s |
| walk-pace | Assez vite pour parler, pas pour chanter. | 3 s |
| walk-arms | Balancez les bras. Expirez un peu plus longtemps que vous n'inspirez. | 5 s |
| walk-halfway | À mi-chemin. Que fait l'envie maintenant ? | 4 s |
| walk-last | Dernière minute. Gardez le rythme jusqu'au bout. | 4 s |
| walk-done | Cinq minutes terminées. Bien marché. | 3 s |
| squeeze-hands | Serrez les poings. Serrez les deux mains aussi fort que c'est confortable. | 5 s |
| squeeze-legs | Serrez cuisses et fessiers. Contractez-les, et continuez à respirer. | 6 s |
| squeeze-push | Poussez. Pressez vos paumes l'une contre l'autre, ou appuyez des mains sur le siège. | 6 s |
| squeeze-rest | Relâchez et reposez-vous. | 2 s |
| squeeze-done | Trois minutes terminées. | 2 s |
| breathe-in | Inspirez. | 1.5 s |
| breathe-hold | Retenez. | 1 s |
| breathe-out | Expirez. | 1.5 s |
| breathe-done | Bravo. | 1.5 s |

### العربية (`ar/`)

**Choose one column before recording, and use it for every clip.**
- **Screen text (MSA):** exactly what the app shows. Voice and text match, which helps people who read along.
- **Tunisian draft:** warmer and closer to how people talk. These are **my drafts**, so have a native speaker check them and change any word that doesn't sound natural. Keep the meaning, and keep it short.

| ID | Screen text (MSA) | Tunisian draft | Max |
|---|---|---|---|
| guide-before-1 | أنا هنا معك. لنعبر هذه الدقائق معًا. | أنا هنا معاك. هيّا نعدّيو الدقايق هاذي مع بعضنا. | 5 s |
| guide-before-2 | الرغبة تأتي كالموج. لنتركها تمرّ معًا. | الرغبة تجي كيف الموجة. هيّا نخلّيوها تتعدّى مع بعضنا. | 5 s |
| guide-before-3 | فتحت هذا بدلًا من علبة سجائر. هذا وحده يُحسب لك. | حلّيت هذا في بلاصة الباكو. هاذي وحدها تتحسب. | 5 s |
| guide-start-1 | بداية جيدة. استمر، أنا هنا. | بداية باهية. كمّل، أنا هنا. | 4 s |
| guide-start-2 | جميل. هذه الدقيقة فقط، لا شيء غيرها. | باهي. الدقيقة هاذي برك، ما تخمّمش في شي آخر. | 4 s |
| guide-half-1 | وصلت إلى المنتصف. أنت تفعلها. | وصلت للنص. راك قاعد تعمل فيها. | 3 s |
| guide-half-2 | انظر إلى نفسك: نصف الطريق بالفعل. | شوف روحك، وصلت للنص ديجا. | 3 s |
| guide-end-1 | اقتربت من النهاية. ابقَ معي. | قرّبت توفى. ابقى معايا. | 3 s |
| guide-end-2 | المرحلة الأخيرة. أنت قادر. | آخر شويّة. تنجم. | 3 s |
| guide-after-1 | أنهيت. هذه خطوة حقيقية. | كمّلت. هاذي خطوة بالحق. | 3 s |
| guide-after-2 | تمّ. خذ نفَسًا، فقد استحققته. | وفات. خوذ نفس، تستاهل. | 3 s |
| guide-ended-early | لا بأس في التوقف مبكرًا. منحت نفسك بضع دقائق رغم ذلك. | عادي كي تحبس بكري. على الأقل عطيت روحك شويّة دقايق. | 5 s |
| guide-best | هذه الأداة تناسبك: معها انخفضت رغبتك أكثر من غيرها. | هاذي اللي تنفعك: معاها الرغبة متاعك هبطت أكثر من غيرها. | 5 s |
| guide-reason | تذكّر لماذا بدأت. *(سطر جديد)* | تفكّر علاش بديت. | 3 s |
| walk-start | انطلق واعثر على خطوة سريعة ومنتظمة. | اخرج ولقى خطوة سريعة وثابتة. | 4 s |
| walk-pace | بسرعة تسمح بالكلام لا بالغناء. | بسرعة تنجم تحكي بيها، أما ما تنجمش تغنّي. | 3 s |
| walk-arms | حرّك ذراعيك. أطِل الزفير قليلًا عن الشهيق. | حرّك يديك. خلّي الزفير أطول شويّة من الشهيق. | 5 s |
| walk-halfway | منتصف الطريق. لاحظ ما تفعله الرغبة الآن. | وصلت للنص. شوف الرغبة شنوّة قاعدة تعمل توّا. | 4 s |
| walk-last | الدقيقة الأخيرة. حافظ على الوتيرة حتى النهاية. | آخر دقيقة. حافظ على نفس السرعة حتى للآخر. | 4 s |
| walk-done | انتهت خمس دقائق. أحسنت المشي. | وفاو خمسة دقايق. مشية باهية. | 3 s |
| squeeze-hands | اقبض يديك. اضغط كلتا يديك بقدر ما يريحك. | سكّر يديك. اضغط على الزوز قدّ ما يريّحك. | 5 s |
| squeeze-legs | شدّ الفخذين والأرداف. واصل التنفّس. | شدّ عضلات فخاذك. وكمّل تنفّس. | 6 s |
| squeeze-push | ادفع. اضغط راحتيك معًا، أو اضغط بيديك على المقعد. | ادفع. اضغط كفوفك على بعضهم، ولّا اضغط بيديك على الكرسي. | 6 s |
| squeeze-rest | أرخِ واسترح. | سيّب وارتاح. | 2 s |
| squeeze-done | انتهت ثلاث دقائق. | وفاو ثلاثة دقايق. | 2 s |
| breathe-in | شهيق. | دخّل النفس. | 1.5 s |
| breathe-hold | احبس. | شدّ. | 1 s |
| breathe-out | زفير. | خرّج النفس. | 1.5 s |
| breathe-done | أحسنت. | برافو. | 1.5 s |

---

## 3. Before you send

- [ ] One folder per language, files named exactly by ID (29 per folder).
- [ ] Arabic: one column (MSA or Tunisian) used for every clip.
- [ ] Listen to 3 random clips with headphones: no echo, no background noise, same volume as the others.
- [ ] Written OK from anyone whose voice was recorded.
