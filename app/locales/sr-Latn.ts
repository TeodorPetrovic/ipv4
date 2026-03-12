import type { TranslationShape } from './sr-Cyrl'

const srLatn: TranslationShape = {
  layout: {
    logout: 'Odjava',
    languageSwitcher: 'Promeni jezik',
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
    backToTests: 'Nazad na listu testova',
    submitAnswers: 'Predaj odgovore',
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
      title: 'Nivo 1 · Prevođenje iz binarnog u decimalni oblik',
      description: 'Pretvorite binarnu IPv4 adresu u decimalnu formu.',
      binary: 'Binarni',
      decimalAnswer: 'Decimalni odgovor',
    },
    level2: {
      title: 'Nivo 2 · IPv4 klasa',
      description: 'Odredite klasu svake IPv4 adrese.',
      ipAddress: 'IP adresa',
      class: 'Klasa',
    },
    level3: {
      title: 'Nivo 3 · Mrežna i emisiona adresa',
      description: 'Izračunajte mrežnu i emisionu adresu za svaki par host/CIDR.',
      hostAddress: 'Adresa hosta',
      networkAddress: 'Mrežna adresa',
      broadcastAddress: 'Emisiona adresa',
      correctNetwork: 'Tačna mrežna',
      correctBroadcast: 'Tačna emisiona',
    },
    level4: {
      title: 'Nivo 4 · Kapacitet mreže',
      description: 'Upišite broj upotrebljivih hostova za svaku masku podmreže.',
      subnetMask: 'Maska podmreže',
      usableHosts: 'Upotrebljivi hostovi',
    },
    level5: {
      title: 'Nivo 5 · Adrese računara sa javnim Internet adresama',
      description: 'Odredite da li se data adresa hosta može koristiti za javno Internet adresiranje.',
      address: 'Adresa',
      usableOnInternet: 'Upotrebljiva na Internetu?',
    },
    level6: {
      title: 'Nivo 6 · Lokalne i udaljene adrese',
      description: 'Odredite da li svaki par adresa pripada istoj mreži.',
      address1: 'Adresa 1',
      address2: 'Adresa 2',
      subnetMask: 'Maska podmreže',
      sameNetwork: 'Ista mreža?',
    },
    level7: {
      title: 'Nivo 7 · Projekat podmrežavanja',
      description: 'Podelite {{network}}/{{cidr}} na zahtevane veličine podmreža.',
      subnet: 'Podmreža',
      hosts: 'Hostova',
      networkAddress: 'Mrežna adresa',
      subnetMask: 'Maska podmreže',
      broadcastAddress: 'Emisiona adresa',
    },
  },
}

export default srLatn
