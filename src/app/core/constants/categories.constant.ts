export interface MunicipalCategory {
  id: number;
  name: string;
}

export const DEFAULT_MUNICIPAL_CATEGORIES: MunicipalCategory[] = [
  { "id": 1, "name": "Afval (Hoofdcategorie)" },
  { "id": 20, "name": "Afval - Afvalcontainer defect of vol" },
  { "id": 21, "name": "Afval - Illegale dumping of storting" },
  { "id": 22, "name": "Afval - Zwerfvuil" },
  { "id": 110, "name": "Afval - Afvalbak op straat kapot" },
  { "id": 111, "name": "Afval - Afvalbak op straat vol" },

  { "id": 2, "name": "Bomen (Hoofdcategorie)" },
  { "id": 30, "name": "Bomen - Worteldruk (schade aan asfalt of tegels)" },
  { "id": 32, "name": "Bomen - Gevaarlijke of loshangende takken" },
  { "id": 33, "name": "Bomen - Omgevallen of scheefstaande boom" },
  { "id": 34, "name": "Bomen - Overlast door takken (zicht of licht)" },
  { "id": 35, "name": "Bomen - Schade aan boom of stam" },
  { "id": 36, "name": "Bomen - Zieke of dode boom" },
  { "id": 168, "name": "Bomen - Verzoek tot snoeien" },

  { "id": 3, "name": "Bruggen en viaducten (Hoofdcategorie)" },
  { "id": 40, "name": "Bruggen - Onderdelen kapot of beschadigd" },
  { "id": 41, "name": "Bruggen - Onderhoud nodig" },

  { "id": 4, "name": "Groenonderhoud (Hoofdcategorie)" },
  { "id": 50, "name": "Groen - Bermen onderhoud" },
  { "id": 51, "name": "Groen - Gazon of gras maaien" },
  { "id": 52, "name": "Groen - Kanten en randen maaien" },
  { "id": 53, "name": "Groen - Onkruid in beplanting" },
  { "id": 54, "name": "Groen - Onkruid op verharding" },
  { "id": 55, "name": "Groen - Overgroeiende struiken of beplanting" },
  { "id": 169, "name": "Groen - Bladoverlast en bladkorven" },

  { "id": 5, "name": "Kabels en leidingen (Hoofdcategorie)" },
  { "id": 60, "name": "Kabels - Werkzaamheden en blootliggende leidingen" },

  { "id": 6, "name": "Openbaar water (Hoofdcategorie)" },
  { "id": 56, "name": "Water - Duiker verstopt of kapot" },
  { "id": 70, "name": "Water - Blauwalg en waterkwaliteit" },
  { "id": 71, "name": "Water - Dode vis of kadavers in water" },
  { "id": 72, "name": "Water - Drijfvuil en zinkvuil" },
  { "id": 170, "name": "Water - Sloten dichtgegroeid of onderhoud" },

  { "id": 7, "name": "Openbare verlichting (Hoofdcategorie)" },
  { "id": 80, "name": "Verlichting - Lantaarn defect of lamp uit" },
  { "id": 81, "name": "Verlichting - Schade aan lichtmast of paal scheef" },
  { "id": 82, "name": "Verlichting - Verzoek tot kleine aanpassing" },

  { "id": 8, "name": "Riolering en grondwater (Hoofdcategorie)" },
  { "id": 90, "name": "Riolering - Huisaansluiting" },
  { "id": 91, "name": "Riolering - Grondwateroverlast" },
  { "id": 92, "name": "Riolering - Putdeksel weg of los" },
  { "id": 93, "name": "Riolering - Rioolverstopping en afvoerproblemen" },
  { "id": 94, "name": "Riolering - Stankoverlast riool" },
  { "id": 95, "name": "Riolering - Straatkolk of put verstopt of verzakt" },
  { "id": 96, "name": "Riolering - Water op straat bij regen" },

  { "id": 9, "name": "Sport en spel (Hoofdcategorie)" },
  { "id": 100, "name": "Sport en spel - Trapvelden en skateparken" },
  { "id": 102, "name": "Sport en spel - Speelvoorziening gevaarlijk of onveilig" },
  { "id": 103, "name": "Sport en spel - Speelvoorziening kapot" },

  { "id": 10, "name": "Straatmeubilair (Hoofdcategorie)" },
  { "id": 112, "name": "Meubilair - Bankjes beschadigd" },
  { "id": 113, "name": "Meubilair - Bebording en verkeersborden beschadigd" },
  { "id": 114, "name": "Meubilair - Fietsenrekken defect of weesfietsen" },
  { "id": 115, "name": "Meubilair - Graffiti op objecten" },
  { "id": 116, "name": "Meubilair - Hekwerken defect" },
  { "id": 117, "name": "Meubilair - Paaltjes en amsterdammertjes los of scheef" },
  { "id": 118, "name": "Meubilair - Verkeerslichten storing of kapot" },

  { "id": 12, "name": "Wegen en straten (Hoofdcategorie)" },
  { "id": 140, "name": "Wegen - Asfaltschade of gaten in de weg" },
  { "id": 141, "name": "Wegen - Belijning en wegmarkering vervaagd" },
  { "id": 142, "name": "Wegen - Bestrating en losse stoeptegels" },
  { "id": 143, "name": "Wegen - Gladheidsbestrijding en strooien" },
  { "id": 145, "name": "Wegen - Onverharde wegen en kuilen in zandpad" },
  { "id": 146, "name": "Wegen - Straatvervuiling en modder op de weg" },

  { "id": 13, "name": "Dieren en ongedierte (Hoofdcategorie)" },
  { "id": 31, "name": "Dieren - Eikenprocessierups" },
  { "id": 123, "name": "Dieren - Overlast door honden (loslopen of bijten)" },
  { "id": 124, "name": "Dieren - Overlast hondenpoep" },
  { "id": 150, "name": "Dieren - Ongedierte (algemeen)" },
  { "id": 151, "name": "Dieren - Overlast wilde dieren (vogels of wespen)" },
  { "id": 152, "name": "Dieren - Ratten en muizen" },
  { "id": 153, "name": "Dieren - Dood dier of kadaver op straat" },
  { "id": 166, "name": "Dieren - Luizen in groen" },
  { "id": 167, "name": "Dieren - Hondenoverlast algemeen" },

  { "id": 11, "name": "Toezicht en handhaving (Hoofdcategorie)" },
  { "id": 120, "name": "Handhaving - Milieuoverlast en bodemverontreiniging" },
  { "id": 121, "name": "Handhaving - Overlast alcohol of druggebruik" },
  { "id": 122, "name": "Handhaving - Overlast door jeugd" },
  { "id": 125, "name": "Handhaving - Vuurwerkoverlast" },
  { "id": 126, "name": "Handhaving - Parkeeroverlast en foutparkeren" },
  { "id": 127, "name": "Handhaving - Snelheid te hoog" },
  { "id": 129, "name": "Handhaving - Verkeersonveilige situaties" },
  { "id": 130, "name": "Handhaving - Vernieling van gemeentelijke eigendommen" },
  { "id": 163, "name": "Handhaving - Geluidsoverlast" },
  { "id": 165, "name": "Handhaving - Overlast jongerenopvangplek" },
  { "id": 171, "name": "Handhaving - Houtrookoverlast" },

  { "id": 161, "name": "Gebouwen - Openbare gemeentelijke gebouwen" }
];
