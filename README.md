# Saathi (साथी) — Offline-First Assistive App

> An offline-first Android app for people who are blind or low-vision,
> deaf or hard of hearing, or who have difficulty speaking, with an
> emergency SOS and a friendly assistant that speaks English, Hindi and
> Telugu. Built for India, where connectivity is patchy and most
> assistive tools speak only English.

**📱 Android app (no live website).** Install the APK on an Android phone, or
build it yourself using the steps under [Run locally](#run-locally).

**📄 [Project report](#)** ·
**📊 [Presentation](#)**

*(Add your links, or delete the demo, report and presentation row if you
don't have them. For the APK, upload it under the GitHub repository's
Releases page and link it here.)*

---

## What this is

Saathi means "companion" in Hindi. It puts the tools people usually need
from many separate apps into one, and does three things most assistive
apps don't:

1. **Works without internet.** SOS, reminders, text reading, object
   recognition, Speak for me, English and Hindi captions and voice input
   all run on the phone. Online features are off by default and are an
   explicit switch.
2. **Speaks the user's language.** The assistant answers in English,
   Hindi and Telugu, with offline commands in all three.
3. **Is honest about its limits.** It refuses medical diagnosis and dose
   advice, labels machine translation as machine translation, and never
   presents captions or object detection as a safety guarantee.

It is an assistive aid. It does not replace a cane, a guide or a doctor,
and says so in the app.

---

## Who it helps

| Group                    | What Saathi gives them                                         |
|--------------------------|----------------------------------------------------------------|
| Blind / low vision       | Read text aloud, describe objects nearby, emergency help       |
| Deaf / hard of hearing   | Live captions of speech, sign language learning                |
| Speech-impaired          | Type to speak, saved phrases, picture board, translation       |
| Everyone                 | SOS, medicine and appointment reminders, voice assistant       |

---

## Features

| Feature                  | What it does                                                                 | Offline? |
|--------------------------|------------------------------------------------------------------------------|----------|
| Emergency SOS            | Always-visible red button. Calls 112 and sends an SMS with a map link to saved contacts | Yes |
| Medicines & appointments | Add by hand or by saying "remind me to take tablet at 8 pm". Daily medicine reminders, appointment reminders one hour before | Yes |
| Camera: Read text        | Reads printed English aloud (ML Kit text recognition)                        | Yes      |
| Camera: What is around me| Recognises about 80 everyday objects, says left, ahead or right. Does not judge distance | Yes |
| Speak for me             | Type, saved phrases, picture board of common needs                           | Yes      |
| Translate and speak      | Hindi or Telugu translation, after a one-time language pack download         | Yes (after download) |
| Live captions            | Large live text for deaf and hard of hearing users                           | English, Hindi: yes. Telugu: no |
| Assistant                | Reminders, lists, time and date, open features, short first-aid notes, emergency | Yes |
| Voice input              | Microphone input to the assistant                                            | English, Hindi: yes. Telugu: no |
| Online help (off by default) | Free-form questions in English, Hindi and Telugu                         | No       |
| Learn                    | Pages about each feature and signs, sign quiz                                | Yes      |
| Medical ID, profile, app lock, lock-screen emergency card | Emergency information for helpers | Yes |

The SOS never depends on the assistant or on a network. The user still
presses call and send. The app does not bypass the phone's lock screen;
for that, Settings explains how to turn on the phone's own Emergency
Information and Emergency SOS.

---

## Offline vs online

| Works fully offline                          | Needs internet                                 |
|----------------------------------------------|------------------------------------------------|
| SOS call and SMS                             | Online assistant answers                       |
| Reminders                                    | Telugu captions and Telugu voice input         |
| Read text, What is around me                 | First download of translation packs            |
| Speak for me, phrases, picture board         |                                                |
| English and Hindi captions and voice input   |                                                |
| First-aid text, Medical ID                   |                                                |
| Hindi and Telugu typed assistant commands    |                                                |

Telugu voice is online-only because Android phones have no offline
Telugu speech pack (error 12).

---

## Safety and honesty rules

- **No diagnosis, no medicine or dose advice.** Medical questions in
  English, Hindi and Telugu are refused with a pointer to a doctor, a
  pharmacist or 112.
- **First-aid text is short and general** and must be reviewed by a
  qualified person before public release.
- **No sign-language recognition.** Sign descriptions are still being
  checked against the ISLRTC dictionary or a deaf signer; the app says so.
- **Translations are machine translations**, and captions and object
  detection can be wrong. The app says so.
- **Privacy:** all personal data stays on the phone. The only exceptions
  are words typed to the assistant with Online help on (sent to
  Cloudflare Workers AI) and captions with online mode on (sent to
  Google). Medicines, contacts and location are never sent.

---

## Stack

| Layer              | Tools                                                                     |
|--------------------|---------------------------------------------------------------------------|
| App                | Expo (SDK 57), React Native, TypeScript, Android dev and release builds   |
| Camera and AI      | react-native-vision-camera, ML Kit text recognition and translation, EfficientDet-Lite0 via react-native-fast-tflite |
| Voice              | expo-speech (speaking), expo-speech-recognition (microphone, captions)    |
| Storage, reminders | AsyncStorage, expo-notifications                                          |
| Online help        | Cloudflare Worker with Workers AI (Llama 3.1 8B), free tier               |
| Accessibility      | Roles and labels on every control, touch targets of at least 64 px, adjustable text size |

No API key is stored inside the app; online help goes through a small
server of our own.

---

## Run locally

Requirements: Node.js, Android Studio / Android SDK, a physical Android
phone with USB debugging, Windows PowerShell (commands below).

```powershell
# 1. Install dependencies
npm install

# 2. Create your local config (this file is git-ignored, never commit it)
#    src/config.ts holds the online-help URL and token.

# 3. Start Metro for the development build
npx expo start --dev-client

# 4. Connect the phone (second terminal)
adb devices
adb reverse tcp:8081 tcp:8081
```

Open the Saathi development app on the phone. Wait for `Android Bundled`
in the Metro terminal.

### Release build (works without the PC)

```powershell
cd android
.\gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app\build\outputs\apk\release\app-release.apk
```

The build takes 10 to 20 minutes. If it fails with a stale cache, run
`.\gradlew --stop`, then `.\gradlew clean`, then build again.

---

## How it was built

Built phase by phase: shell and onboarding, SOS, reminders, camera,
Speak for me, assistant (offline, then online), captions and voice.
After each phase it was tested on a real phone, a release build was
installed and tested with no PC, and the work was committed to Git.

Real problems solved along the way:

- The detection model failed to load in release builds. Fixed by
  unpacking it to a file.
- Telugu has no offline speech pack. Handled with clear on-screen
  messages and an online option.
- A medical question was wrongly read as "list my medicines". Fixed so
  medical questions are refused before any other rule.
- A retired cloud AI model had to be replaced.

---

## Repository structure

```
.
├── App / screens / components   # React Native UI (Expo)
├── src/
│   ├── agent.ts                 # Offline assistant rules (English, Hindi, Telugu)
│   └── config.ts                # Local secrets and URLs (git-ignored)
├── android/                     # Native Android project
├── assets/                      # Logo, splash, model file
└── package.json
```

*(Adjust folder names to match your actual project.)*

---

## Limitations

- **Sound alerts are not built** (doorbell, siren, horn with vibration
  and screen flash). They need raw microphone audio and a sound model,
  can miss sounds or give false alarms, and must never be sold as a
  safety guarantee.
- **Telugu offline captions and voice** are not possible on current phones.
- **Sign descriptions** still need checking against the ISLRTC dictionary.
- **Offline reminders by voice** work in English only; Hindi and Telugu
  offline commands cover emergency, camera, time, date, medicines and
  appointments.
- **Online help** uses a simple token as a weak lock; a per-device limit
  is needed before public release.
- **Not yet tested** with TalkBack, low-end phones or real users.

---

## Roadmap

- Hindi and Telugu app screens, and Hindi and Telugu reminders
- Sound alerts, after checking which libraries can support them
- Testing with TalkBack, low-end phones and real users
- iOS
- Play Store release with a privacy policy and DPDP Act 2023 compliance

---

## Citation

If this work informs further research or projects, please credit:

```
[Ishanvi reddy, Kothapally Aarthi, Madhumita maddala] (2026). Saathi: An Offline-First Assistive App for
Blind, Deaf and Speech-Impaired Users in English, Hindi and Telugu.
[KL university / Artificial intelligence and data science], Final Project.
```

---

## License

Code: MIT *(or your choice, add a LICENSE file)*.

---

## Author

**[Ishanvi reddy]** — [Btech, Artificial intelligence and data science], [KL university]
**[Kothapally aarthi]** — [Btech, Artificial intelligence and data science], [KL university]
**[Madhumita maddala]** — [Btech, Artificial intelligence and data science], [KL university]
Guide: [Dr.P.Sirisha]

GitHub: [Ishanvireddy79](https://github.com/Ishanvireddy79/saathi-finalproject.git) ·
Email: [2420080071@klh.edu.in]
