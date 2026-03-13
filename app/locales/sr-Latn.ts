import type { TranslationShape } from './sr-Cyrl'

const srLatn: TranslationShape = {
  layout: {
    logout: 'Odjava',
    languageSwitcher: 'Promeni jezik',
    toggleTheme: 'Promeni temu',
    student: 'Student',
  },
  ipConverter: {
    title: 'IP konvertor',
    decimalToBinary: 'Decimalni u binarni',
    binaryToDecimal: 'Binarni u decimalni',
    invalidValue: 'Nevalidna vrednost',
  },
  timer: {
    remainingTime: 'Preostalo vreme',
  },
  common: {
    yes: 'Da',
    no: 'Ne',
    cancel: 'Otkaži',
    continue: 'Nastavi',
    refresh: 'Osveži',
    backToTests: 'Nazad na listu testova',
    submitAnswers: 'Predaj odgovore',
  },
  login: {
    studentTitle: 'Prijava studenta',
    studentDescription: 'Unesite broj indeksa da biste videli dostupne testove.',
    studentIdLabel: 'Broj indeksa',
    studentIdPlaceholder: '2024123456',
    adminTitle: 'Admin prijava',
    adminDescription: 'Unesite imejl i lozinku za upravljanje testovima, studentima i rezultatima.',
    emailLabel: 'Imejl',
    passwordLabel: 'Lozinka',
    passwordPlaceholder: 'Unesite lozinku',
    errors: {
      studentIdRequired: 'Broj indeksa je obavezan',
      studentLoginFailed: 'Prijava nije uspela',
      adminLoginFailed: 'Admin prijava nije uspela',
    },
  },
  tests: {
    searchPlaceholder: 'Pretraži testove',
    empty: 'Nema dostupnih testova.',
    start: 'Počni',
    table: {
      test: 'Test',
      action: 'Akcija',
    },
    confirm: {
      title: 'Počni test',
      description: 'Da li želite da pokrenete ovaj test sada?',
    },
    errors: {
      loadFailed: 'Nije moguće učitati testove',
      openFailed: 'Nije moguće otvoriti ovaj test',
    },
  },
  test: {
    errors: {
      loadFailed: 'Nije moguće učitati ovaj pokušaj.',
      submitTitle: 'Greška pri predavanju',
      submitFailed: 'Nije moguće predati ovaj pokušaj.',
    },
  },
  results: {
    errors: {
      loadFailed: 'Nije moguće učitati rezultate',
      unavailable: 'Rezultati nisu dostupni.',
    },
    expired: 'Rok za predaju je istekao',
    submitted: 'Test predat',
    yourResult: 'Vaš rezultat',
    correctPoints: 'tačnih poena',
    passed: 'Test položen',
    partial: 'Delimično tačno',
    failed: 'Test nije položen',
    yourAnswer: 'Vaš odgovor',
    correctAnswer: 'Tačan odgovor',
    yourNetworkAddress: 'Vaša mrežna adresa',
    yourMask: 'Vaša maska',
    yourBroadcast: 'Vaša emisiona adresa',
    correctNetworkAddress: 'Tačna mrežna adresa',
    correctMask: 'Tačna maska',
    correctBroadcast: 'Tačna emisiona adresa',
  },
  levels: {
    level1: {
      title: 'Nivo 1 - Prevođenje iz binarnog u decimalni oblik',
      description: 'Binarno zadate mrežne adrese prevesti u decimalni oblik:',
      binary: 'Binarni',
      decimalAnswer: 'Decimalni odgovor',
    },
    level2: {
      title: 'Nivo 2 - IPv4 klasa',
      description: 'Izračunati klase mrežnih adresa:',
      ipAddress: 'IP adresa',
      class: 'Klasa',
    },
    level3: {
      title: 'Nivo 3 - Mrežna i emisiona adresa',
      description: 'Za zadate adrese izračunati adresu mreže i emisionu adresu:',
      hostAddress: 'Adresa hosta',
      networkAddress: 'Mrežna adresa',
      broadcastAddress: 'Emisiona adresa',
      correctNetwork: 'Tačna mrežna',
      correctBroadcast: 'Tačna emisiona',
    },
    level4: {
      title: 'Nivo 4 - Kapacitet mreže',
      description: 'Izračunati najveći mogući broj računara u mrežama sa sledećim mrežnim maskama:',
      subnetMask: 'Maska podmreže',
      usableHosts: 'Upotrebljivi hostovi',
    },
    level5: {
      title: 'Nivo 5 - Adrese računara sa javnim Internet adresama',
      description: 'Izračunati koje se od sledećih adresa mogu koristiti za adresovanje računara na Internetu:',
      address: 'Adresa',
      usableOnInternet: 'Upotrebljiva na Internetu?',
    },
    level6: {
      title: 'Nivo 6 - Lokalne i udaljene adrese',
      description: 'Izračunati da li se sledeći računari nalaze u istoj mreži:',
      address1: 'Adresa 1',
      address2: 'Adresa 2',
      subnetMask: 'Maska podmreže',
      sameNetwork: 'Ista mreža?',
    },
    level7: {
      title: 'Nivo 7 - Projekat podmrežavanja',
      description: 'Za potrebe mreže organizacije dodeljen je opseg 152.169.21.0/24. Podeliti opseg u manje mreže koje bi sadržale navedeni broj računara po odeljenju. Mreže moraju biti najmanje moguće veličine a sortirane po datom redosledu.',
      subnet: 'Podmreža',
      hosts: 'Hostova',
      networkAddress: 'Mrežna adresa',
      subnetMask: 'Maska podmreže',
      broadcastAddress: 'Emisiona adresa',
    },
  },
}

export default srLatn
