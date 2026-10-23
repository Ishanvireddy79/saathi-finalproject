export type Sign = {
    id: string;
    word: string;
    hindi?: string;
    howTo: string;
    say: string;
    image?: any;
  };
  
  export type SignCategory = {
    id: string;
    title: string;
    intro: string;
    signs: Sign[];
  };
  
  export const SIGN_LESSONS: SignCategory[] = [
    {
      id: 'emergency',
      title: 'Emergency Basics',
      intro: 'These signs tell people you need urgent help.',
      signs: [
        { id: 'help', word: 'HELP', hindi: 'मदद',
          howTo: 'Make a fist with one hand, place it on your open flat palm, and lift both hands up together.',
          say: 'This person needs HELP.' },
        { id: 'danger', word: 'DANGER', hindi: 'खतरा',
          howTo: 'Make claw hands with both hands, cross your arms at the wrists in front of your chest, then pull them apart quickly.',
          say: 'There is DANGER.' },
        { id: 'doctor', word: 'DOCTOR', hindi: 'डॉक्टर',
          howTo: 'Touch your wrist with the fingertips of your other hand, as if checking a pulse.',
          say: 'I need a DOCTOR.' },
        { id: 'hospital', word: 'HOSPITAL', hindi: 'अस्पताल',
          howTo: 'Form an H with both index fingers touching, then draw a cross on your upper arm.',
          say: 'Take me to a HOSPITAL.' },
        { id: 'ambulance', word: 'AMBULANCE', hindi: 'एम्बुलेंस',
          howTo: 'Make fists stacked like flashing lights, one on top of the other, opening and closing fingers alternately.',
          say: 'Call an AMBULANCE.' },
        { id: 'police', word: 'POLICE', hindi: 'पुलिस',
          howTo: 'Tap the back of one open hand with the palm of your other hand, like a badge.',
          say: 'Call the POLICE.' },
      ],
    },
    {
      id: 'what-happened',
      title: 'What Happened',
      intro: 'Use these signs to explain what happened to you.',
      signs: [
        { id: 'pain', word: 'PAIN', hindi: 'दर्द',
          howTo: 'Point both index fingers toward each other and twist them near the painful area of your body.',
          say: 'I am in PAIN.' },
        { id: 'fall', word: 'I FELL', hindi: 'गिर गया',
          howTo: 'Open hands push down at your sides, then let your body drop slightly forward.',
          say: 'I FELL DOWN.' },
        { id: 'bleeding', word: 'BLEEDING', hindi: 'खून',
          howTo: 'Make a loose open hand at your nose and pull it downward, like blood dripping.',
          say: 'I am BLEEDING.' },
        { id: 'breathe', word: 'CANNOT BREATHE', hindi: 'सांस नहीं आ रही',
          howTo: 'Place a flat hand on your chest, shake your head no, and show a pained face.',
          say: 'I CANNOT BREATHE.' },
        { id: 'chest', word: 'CHEST PAIN', hindi: 'सीने में दर्द',
          howTo: 'Make fists with both hands and rub them in circles over your chest.',
          say: 'CHEST PAIN.' },
        { id: 'head', word: 'HEAD INJURY', hindi: 'सिर में चोट',
          howTo: 'Tap the side of your head with an open hand, then show the PAIN sign near it.',
          say: 'HEAD INJURY.' },
      ],
    },
    {
      id: 'talk',
      title: 'Basic Communication',
      intro: 'Simple signs to answer questions from helpers.',
      signs: [
        { id: 'yes', word: 'YES', hindi: 'हाँ',
          howTo: 'Make a fist and bob it up and down, like a nodding head.',
          say: 'YES.' },
        { id: 'no', word: 'NO', hindi: 'नहीं',
          howTo: 'Tap the thumb of one hand against your chin and move the hand forward sharply.',
          say: 'NO.' },
        { id: 'name', word: 'MY NAME IS', hindi: 'मेरा नाम',
          howTo: 'Point to yourself, then fingerspell or sign your name.',
          say: 'I want to tell you MY NAME.' },
        { id: 'water', word: 'WATER', hindi: 'पानी',
          howTo: 'Make a W shape with three fingers and tap it against your chin.',
          say: 'I need WATER.' },
        { id: 'call', word: 'CALL MY FAMILY', hindi: 'परिवार को फोन करें',
          howTo: 'Make a phone hand at your ear, then bring both hands together to form a circle for FAMILY.',
          say: 'Please CALL MY FAMILY.' },
        { id: 'where', word: 'WHERE DOES IT HURT?', hindi: 'कहाँ दर्द है',
          howTo: 'Point with an open questioning face, then use the PAIN sign near the body part.',
          say: 'WHERE does it hurt?' },
      ],
    },
  ];