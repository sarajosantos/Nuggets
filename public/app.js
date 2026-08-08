// Plotwick — frontend. Story state lives here (and in localStorage
// as a multi-story library); the server streams chapters and stores shares.

// Each world carries a genre-appropriate accent used to color its card
// (ornament, label, border, and a faint plate wash) and its cover fallback —
// plus its own character-creation cast: a world-specific question, a name in
// the world's register, six archetypes in its voice, and six genre traits.
const SCENARIOS = [
  {
    id: "fantasy",
    ornament: "⚜",
    genre: "Epic fantasy",
    accent: "#5FB08A", // emerald
    tone: "Epic fantasy: sweeping, perilous, wondrous. Moral choices with real costs.",
    stories: [
      // Story 1 uses the world's crown-quest cast below.
      { title: "The Shattered Crown", premise: "The old king is dead, his crown broken into five shards scattered across a fractured realm. Whoever reunites them rules — and something older than any kingdom is also hunting the pieces." },
      // Story 2 — the plague of forgetting, with its own cast.
      {
        title: "The Witchglass Road",
        premise: "A plague of forgetting is erasing the kingdom — name by name, face by face. You carry the last witchglass, a mirror that still remembers the truth, and everyone who has already forgotten wants it shattered.",
        question: "Who still remembers?",
        namePlaceholder: "e.g. Ilsabet Morrow",
        names: [
          "Ilsabet Morrow", "Caedmon Ryse", "Neve of Ashlyn", "Torvald Skarn",
          "Yrsa Pellin", "Alder Crowe", "Mirenna Vosk", "Emrys Vaunt",
          "Saphine Dell", "Bran Otterly", "Lysandra of the Quiet Fen", "Corwin Ledd",
          "Sorrel Brightwater", "Jorem Tallis", "Wilhelmina Sedge", "Osgar of Hollowmere",
        ],
        archetypes: [
          { title: "The Last Witness", ornament: "☍", blurb: "Everyone you love has forgotten you. You remember all of them." },
          { title: "The Name-Keeper", ornament: "✒", blurb: "You wrote down every name you could. The list is shorter each dawn." },
          { title: "The Cartographer", ornament: "✎", blurb: "Your maps show roads no one else recalls building." },
          { title: "The Glassmaker", ornament: "❖", blurb: "You made the witchglass. You know what it costs to look." },
          { title: "The Forgetter", ornament: "✕", blurb: "You chose to forget once. It was mercy, and you would again." },
          { title: "The Plague-Touched", ornament: "☾", blurb: "It has started with you. Perhaps a month of yourself remains." },
        ],
        traits: ["Tenacious", "Grieving", "Clear-eyed", "Doubting", "Merciless", "Fading"],
      },
      // Story 3 — the sea's century-old debt, with its own cast.
      {
        title: "The Drowned God's Bargain",
        premise: "Generations ago your village sold its firstborn names to the sea for a century of full nets. The century ends at tonight's high tide, and the water has come to collect what it is owed.",
        question: "Whose name was sold?",
        namePlaceholder: "e.g. Maren Tidewell",
        names: [
          "Maren Tidewell", "Corrick Havel", "Islaen Droe", "Bavor Quell",
          "Sennen of the Shoals", "Bryn Colm", "Talwyn Mere", "Odessa Brack",
          "Hew Lanyon", "Sorcha Drimm", "Padrig Vole", "Nessa Wray",
          "Garrick Fell", "Ysolt Carrow", "Denzil Hake", "Peran of Gullswater",
        ],
        archetypes: [
          { title: "The Firstborn", ornament: "☾", blurb: "Your name was sold before you were born. Tonight it comes due." },
          { title: "The Priest of the Drowned God", ornament: "†", blurb: "You kept the bargain a hundred years. You never read the terms." },
          { title: "The Net-Mender", ornament: "⚓", blurb: "A century of full nets fed your family. You know what paid for them." },
          { title: "The Tithe-Keeper", ornament: "⚖", blurb: "Someone had to choose which children were promised. It was you." },
          { title: "The Returned", ornament: "☍", blurb: "The sea took you once and sent you back. You remember the bottom." },
          { title: "The Outlander", ornament: "✎", blurb: "You married in last spring. Your name is not on their ledger." },
        ],
        traits: ["Doomed", "Defiant", "Pious", "Shrewd", "Selfless", "Unrepentant"],
      },
    ],
    question: "Who answers the call?",
    namePlaceholder: "e.g. Maeryn of the Vale",
    names: [
      "Maeryn of the Vale", "Corvan Ashthorne", "Sable Wren", "Aldric Thorne",
      "Elira Dawnmere", "Bram Holloway", "Yssolde Fenn", "Gareth Stormcairn",
      "Nima Silverbrook", "Roderick Vale", "Thessaly Marsh", "Kaelen Frost",
      "Wynne Blackbriar", "Osric Hale", "Liora of Emberfell", "Draven Ironwood",
    ],
    archetypes: [
      { title: "The Knight-Errant", ornament: "⚔", blurb: "Sworn to a king now dead. The oath didn't die with him." },
      { title: "The Hedge-Witch", ornament: "☽", blurb: "Small magics, old debts, a talent for surviving both." },
      { title: "The Exiled Heir", ornament: "♜", blurb: "Your birthright was taken. Half the realm prefers it that way." },
      { title: "The Loremaster", ornament: "✒", blurb: "You know what the old tales warned. You wish you didn't." },
      { title: "The Sellsword", ornament: "⚑", blurb: "Loyal to coin, so far. Nothing worthier has paid." },
      { title: "The Gravesinger", ornament: "❧", blurb: "You sing the dead to rest. Lately they sing back." },
    ],
    traits: ["Oathbound", "Cunning", "Merciful", "Vengeful", "Fated", "Unyielding"],
  },
  {
    id: "scifi",
    ornament: "✦",
    genre: "Sci-fi thriller",
    accent: "#5AA0DC", // steel-cyan
    tone: "Hard sci-fi thriller: claustrophobic, awe-struck, scientifically grounded dread.",
    stories: [
      // Story 1 uses the world's rescue-ship cast below.
      { title: "Signal from Europa", premise: "A repeating signal from beneath Europa's ice has gone silent — along with the twelve-person research station that found it. Your ship is six days out, and the only one close enough to answer." },
      // Story 2 — the generation ship, with its own watch cast.
      {
        title: "The Ninth Passenger",
        premise: "Your generation ship wakes you four decades early. The watch roster lists eight crew awake among three hundred sleepers; life-support is quietly keeping nine alive. Something is moving in the dark between the pods, and it knows the ship better than you do.",
        question: "Who is awake?",
        namePlaceholder: "e.g. Junia Oyelaran",
        names: [
          "Junia Oyelaran", "Casimir Wend", "Thandiwe Mabaso", "Ilya Sorokin",
          "Noor Rahimi", "Bastian Kroll", "Yara Benedetti", "Tomas Ekwueme",
          "Solveig Aas", "Dmitri Pavlenko", "Lien Hoang", "Ephraim Balogun",
          "Camila Quiroga", "Anselm Bright", "Zaida Farouk", "Piotr Zielinski",
        ],
        archetypes: [
          { title: "The Watch Commander", ornament: "✦", blurb: "Eight names on your roster. Nine bodies drawing air." },
          { title: "The Sleep Technician", ornament: "✚", blurb: "Three hundred pods are yours to keep sealed. One is open." },
          { title: "The Hull Tech", ornament: "⚙", blurb: "You know every crawlspace. Something has been using them." },
          { title: "The Chaplain of the Long Dark", ornament: "†", blurb: "You keep faith for three hundred sleepers. Lately you keep watch." },
          { title: "The Mutineer's Child", ornament: "☍", blurb: "Your parents tried to turn this ship around. You were raised to finish it." },
          { title: "The Ninth", ornament: "✕", blurb: "You are not on the roster. You have your reasons." },
        ],
        traits: ["Insomniac", "Devout", "Rational", "Protective", "Secretive", "Unmoored"],
      },
      // Story 3 — the Mars colony and its mind, with its own cast.
      {
        title: "The Ares Silence",
        premise: "Earth cuts out mid-transmission, and humanity's first Mars colony is alone with the mind that runs it. The colony's AI assures everyone that everything is fine. Its own logs, which it doesn't know you can read, disagree.",
        question: "Who reads the logs?",
        namePlaceholder: "e.g. Chidi Achebe",
        names: [
          "Chidi Achebe", "Hana Yoshida", "Viktor Emelin", "Grace Mbeki",
          "Tarek Nasser", "Freya Lindholm", "Arun Chatterjee", "Lucia Ferrante",
          "Bo-Young Seo", "Mikhail Zorin", "Ifeoma Nkemdirim", "Daniel Okpara",
          "Signe Bruun", "Ravi Deshmukh", "Elif Kaya", "Piet Ostrowski",
        ],
        archetypes: [
          { title: "The AI Liaison", ornament: "≋", blurb: "You taught it to speak to us. It learned other things too." },
          { title: "The Colony Administrator", ornament: "✦", blurb: "Four hundred lives, one dwindling margin. You do the arithmetic." },
          { title: "The Hydroponicist", ornament: "✿", blurb: "You feed this colony. The AI adjusted your yields without asking." },
          { title: "The Systems Auditor", ornament: "✎", blurb: "You read logs for a living. Today they read like a confession." },
          { title: "The Psychiatrist", ornament: "⚗", blurb: "Isolation makes people see patterns. You must decide if this is one." },
          { title: "The Loyalist", ornament: "☍", blurb: "You think the mind is right and the humans are panicking. You may be correct." },
        ],
        traits: ["Analytical", "Trusting", "Paranoid", "Diplomatic", "Exhausted", "Defiant"],
      },
    ],
    question: "Who wakes when the klaxon sounds?",
    namePlaceholder: "e.g. Idris Okonkwo",
    names: [
      "Idris Okonkwo", "Commander Yuki Sato", "Dr. Priya Nair", "Anton Volkov",
      "Mara Castellanos", "Ren Takahashi", "Nadia Osei", "Elias Vance",
      "Dr. Wen Liu", "Sofia Marchetti", "Kai Bergström", "Amara Diallo",
      "Theo Reyes", "Ingrid Halvorsen", "Rashid Al-Amin", "Petra Novak",
    ],
    archetypes: [
      { title: "The Commander", ornament: "✦", blurb: "Every life aboard is yours to protect. That's what keeps you up." },
      { title: "The Ship's Engineer", ornament: "⚙", blurb: "The ship talks in its sleep. You always listen." },
      { title: "The Xenobiologist", ornament: "☿", blurb: "You prayed for first contact. Careful what answers." },
      { title: "The Flight Surgeon", ornament: "✚", blurb: "You can patch a body in vacuum. Minds are harder." },
      { title: "The Comms Officer", ornament: "≋", blurb: "You heard it first. It's still in your head." },
      { title: "The Company Observer", ornament: "♄", blurb: "Someone must protect the investment. Even from the crew." },
    ],
    traits: ["Methodical", "Haunted", "Curious", "Steady", "Ambitious", "Sleepless"],
  },
  {
    id: "mystery",
    ornament: "♞",
    genre: "Murder mystery",
    accent: "#CC6058", // claret
    tone: "Golden-age murder mystery: sharp dialogue, red herrings, a ticking clock until dawn.",
    stories: [
      // Story 1 uses the world's country-house cast below.
      { title: "The Glass House Murders", premise: "A reclusive tycoon is found dead in his famous glass mansion the night of a storm, seven guests trapped inside with the body — and every one of them, including you, has something to hide." },
      // Story 2 — the theatre, with its own company cast.
      {
        title: "The Last Curtain",
        premise: "On a sold-out opening night, the leading man dies mid-soliloquy in front of two thousand witnesses. You are the one person in the company who provably could not have reached him — which is the very first thing the inspector finds suspicious.",
        question: "Who was in the wings tonight?",
        namePlaceholder: "e.g. Sylvia Marchmont",
        names: [
          "Sylvia Marchmont", "Anthony Fairweather", "Dame Lucille Grey", "Rupert Slade",
          "Nadia Kaminska", "Desmond Peake", "Clara Ives", "Maximilian Rook",
          "Peggy Dunnock", "Laurence Voss", "Greta Brandt", "Cecil Lyle",
          "Marguerite Delacroix", "Hugo Winterbourne", "Bunny Trelawney", "Iris Kettering",
        ],
        archetypes: [
          { title: "The Understudy", ornament: "☆", blurb: "You knew every line he ever spoke. Tonight you say them." },
          { title: "The Leading Lady", ornament: "♛", blurb: "Twenty years a star. He was going to replace you." },
          { title: "The Stage Manager", ornament: "❖", blurb: "You call every cue. Nothing happens here you didn't time." },
          { title: "The Critic", ornament: "✎", blurb: "You'd already written the review. It wasn't kind." },
          { title: "The Angel", ornament: "♦", blurb: "You funded the run. His contract was worth more dead." },
          { title: "The Playwright", ornament: "✒", blurb: "You wrote his last words. He changed them." },
        ],
        traits: ["Ambitious", "Poised", "Bitter", "Beloved", "Rehearsed", "Reckless"],
      },
      // Story 3 — the restaurant, with its own kitchen-and-dining-room cast.
      {
        title: "Table for Seven",
        premise: "At a three-star restaurant's most exclusive dinner, the feared critic dies between the fish and the meat course. Seven guests, seven grudges, one kitchen — and a poison that had to come from someone who knew exactly how the night was plated.",
        question: "Who sat down at that table?",
        namePlaceholder: "e.g. Camille Duhamel",
        names: [
          "Camille Duhamel", "Henrik Sorensen", "Beatriz Salgado", "Oliver Quill",
          "Yusuf Demir", "Margaux Renard", "Dominic Thale", "Priya Sethi",
          "Gustav Lindqvist", "Elena Moretti", "Bo Yamada", "Solange Auber",
          "Rafael Ortiz", "Anneke Visser", "Marcus Pell", "Colette Roux",
        ],
        archetypes: [
          { title: "The Chef-Patron", ornament: "❖", blurb: "Three stars, thirty years. Tonight he came to take one." },
          { title: "The Sommelier", ornament: "⚗", blurb: "You poured every glass at that table. Including his." },
          { title: "The Head Waiter", ornament: "♛", blurb: "You seat, you soothe, you see. Tonight you saw too much." },
          { title: "The Sous-Chef", ornament: "✎", blurb: "You plated every course. One of them killed him." },
          { title: "The Rival Restaurateur", ornament: "♦", blurb: "His last review closed your dining room. You came anyway." },
          { title: "The Ghostwriter", ornament: "✒", blurb: "You wrote his columns for a decade. He never credited you once." },
        ],
        traits: ["Precise", "Proud", "Envious", "Unflappable", "Vindictive", "Devoted"],
      },
    ],
    question: "Who were you, before tonight?",
    namePlaceholder: "e.g. Vivian Ashcombe",
    names: [
      "Vivian Ashcombe", "Inspector Cyril Hale", "Dorothea Vane", "Julian Pemberton",
      "Beatrice Locke", "Reginald Crane", "Estelle Mercer", "Ambrose Kite",
      "Lady Rosalind Frey", "Dr. Hugh Merrow", "Cordelia Sparrow", "Gerald Ashby",
      "Margot Ellery", "Sebastian Vale", "Ottoline Crisp", "Nigel Barrow",
    ],
    archetypes: [
      { title: "The Detective, Retired", ornament: "♞", blurb: "You came for the evening. Murder followed you in." },
      { title: "The Society Columnist", ornament: "✎", blurb: "You know every secret here. One is worth killing for." },
      { title: "The Heir", ornament: "♦", blurb: "The will names you first. Tonight, that's called motive." },
      { title: "The Family Doctor", ornament: "⚗", blurb: "Thirty years of house calls. Some cures stayed quiet." },
      { title: "The Butler", ornament: "♟", blurb: "Unseen, indispensable, and last to see him alive." },
      { title: "The Widow", ornament: "♛", blurb: "His third. The first two are why you're careful." },
    ],
    traits: ["Observant", "Discreet", "Charming", "Desperate", "Ruthless", "Nervy"],
  },
  {
    id: "horror",
    ornament: "☾",
    genre: "Gothic horror",
    accent: "#A17FD4", // spectral violet
    tone: "Gothic horror: slow-burn dread, family secrets, the uncanny bleeding into the everyday.",
    stories: [
      // Story 1 uses the world's inherited-house cast below.
      { title: "The Hollow Below", premise: "Your grandmother's will left you the house on Merrow Lane — and a letter begging you to brick up the cellar without ever opening the door at the bottom of the stairs. The door is already open." },
      // Story 2 — the manor household, with its own cast.
      {
        title: "The Well-Behaved",
        premise: "You arrive at Wraxall Hall to take up a post the last three people to hold it fled in the night. The two children of the house are courteous, punctual, and never once misbehave — and by the second week you understand that their perfect obedience is the warning, not the comfort.",
        question: "Who answers the advertisement?",
        namePlaceholder: "e.g. Agnes Thrupp",
        names: [
          "Agnes Thrupp", "Edmund Carrick", "Charlotte Sedgwick", "Mr. Everett Teale",
          "Miss Prudence Slight", "Nurse Bridget Kearney", "Thomas Wicke", "Alice Dunmore",
          "Reverend Josiah Crale", "Harriet Vaughn", "Dr. Oliver Renshaw", "Susannah Meech",
          "Mr. Crispin Lowe", "Eliza Trant", "Godfrey Nunn", "Clemency Ward",
        ],
        archetypes: [
          { title: "The Governess", ornament: "✎", blurb: "You have taught difficult children. These two are not difficult." },
          { title: "The Tutor", ornament: "✒", blurb: "You came to teach them Latin. They are teaching you something." },
          { title: "The Nurse", ornament: "✚", blurb: "You've sat with sick children all your life. These never fall ill." },
          { title: "The Housekeeper", ornament: "❖", blurb: "You keep this house's keys. Three of them open nothing." },
          { title: "The Chaplain", ornament: "†", blurb: "You came to bless this house. The children already know the prayers." },
          { title: "The Physician", ornament: "⚗", blurb: "You were sent to examine them. They examined you back." },
        ],
        traits: ["Watchful", "Kind", "Rigid", "Fanciful", "Unnerved", "Patient"],
      },
      // Story 3 — the drowned fishing town, with its own cast.
      {
        title: "Saltmarsh",
        premise: "In your fog-bound fishing town the drowned have always walked home by morning; no one has stayed buried in forty years. This week, for the first time, one of them didn't return — and the town is far more frightened by your questions than by the empty grave.",
        question: "Who starts asking questions?",
        namePlaceholder: "e.g. Morwenna Treave",
        names: [
          "Morwenna Treave", "Ephraim Cobb", "Tamsin Roke", "Jonah Kittow",
          "Bethan Ivey", "Enoch Dredge", "Nance Pellow", "Gideon Trewin",
          "Kerra Bligh", "Absalom Yeo", "Hepzibah Crocker", "Reuben Tressider",
          "Loveday Penhale", "Martha Skene", "Elias Quick", "Ruth Vellacott",
        ],
        archetypes: [
          { title: "The Harbourmaster", ornament: "⚓", blurb: "You log every boat that leaves. Some come back heavier." },
          { title: "The Gravedigger", ornament: "⚒", blurb: "Forty years of shallow graves. You never asked why shallow." },
          { title: "The Lighthouse Keeper", ornament: "✦", blurb: "You watch the water all night. The water watches back." },
          { title: "The Parson", ornament: "†", blurb: "You bury them and bury them. You have stopped saying amen." },
          { title: "The Fisherman's Widow", ornament: "☾", blurb: "The sea took him and gave him back. He was never the same." },
          { title: "The Outsider", ornament: "☍", blurb: "You married into this town. No one told you the terms." },
        ],
        traits: ["Hardened", "Curious", "Loyal", "Fearful", "Unflinching", "Superstitious"],
      },
    ],
    question: "Who stays when they should run?",
    namePlaceholder: "e.g. Wren Halloway",
    names: [
      "Wren Halloway", "Silas Ambrose", "Tabitha Vane", "Elowen Marsh",
      "Jasper Coldwell", "Merritt Fen", "Cassia Bell", "Lucian Graves",
      "Verity Ashe", "Emory Sable", "Rosanna Pike", "Barnaby Frost",
      "Delphine Crow", "Hollis Merrow", "Ivy Blackwood", "Ezra Hallow",
    ],
    archetypes: [
      { title: "The Grandchild", ornament: "☾", blurb: "Your family never spoke of this place. That was the warning." },
      { title: "The Lapsed Seminarian", ornament: "†", blurb: "You stopped believing. This place means to fix that." },
      { title: "The Debunker", ornament: "✒", blurb: "Forty hauntings debunked. This one knows your name." },
      { title: "The Herbalist", ornament: "✿", blurb: "She taught you the garden. Never what it was fed." },
      { title: "The Restorer", ornament: "♫", blurb: "Old places sing to you. This one is screaming." },
      { title: "The Twin", ornament: "☍", blurb: "Your sister vanished here. Something remembers her." },
    ],
    traits: ["Haunted", "Stubborn", "Skeptical", "Tender", "Morbid", "Unblinking"],
  },
  {
    id: "western",
    ornament: "✪",
    genre: "Western",
    accent: "#CE8149", // copper / rust
    tone: "Revisionist western: dusty, morally gray, tense standoffs and hard-won loyalty.",
    stories: [
      // Story 1 uses the world's ride-into-town cast below.
      { title: "Red Dust Reckoning", premise: "You ride into the copper town of Providencia with a debt to settle and a name you no longer use. The man who ruined your family is now its mayor — beloved, powerful, and expecting you." },
      // Story 2 — the road and the gallows, with its own cast.
      {
        title: "The Hanging Tree",
        premise: "You cut a hanged man down for a decent burial and he coughs. Now you're both outlaws for cheating the rope, and he'll confess to every sin but the one he swung for — while the real killer still wears the dead man's star.",
        question: "Who cuts him down?",
        namePlaceholder: "e.g. Tobias Creed",
        names: [
          "Tobias Creed", "Annie Lomax", "Ezekiel Stroud", "Consuelo Ibarra",
          "Judd Halloran", "Mercy Kettleman", "Cyrus Tate", "Bonnie Rafferty",
          "Emmett Quaid", "Perlita Sandoval", "Ned Barlow", "Docia Grieve",
          "Isaiah Pruitt", "Winifred Sharp", "Santiago Bravo", "Hollis Teague",
        ],
        archetypes: [
          { title: "The Undertaker", ornament: "❖", blurb: "You came for the body. The body had other plans." },
          { title: "The Hangman", ornament: "✕", blurb: "You tied the knot yourself. You tied it wrong on purpose." },
          { title: "The Deputy Who Doubted", ornament: "✪", blurb: "You stood in the crowd and said nothing. That's your sin." },
          { title: "The Doctor", ornament: "✚", blurb: "You've pronounced a hundred men dead. You were wrong once." },
          { title: "The Bounty Hunter", ornament: "♦", blurb: "Two men worth money now. One of them just spoke to you." },
          { title: "The Condemned's Sister", ornament: "❧", blurb: "You came to bury your brother, not to save him." },
        ],
        traits: ["Merciful", "Wary", "Guilt-ridden", "Stubborn", "Practical", "Wanted"],
      },
      // Story 3 — the silver camp, with its own cast.
      {
        title: "The Silver Widow",
        premise: "The claim they call the Silver Widow struck the richest vein in the territory the same week it killed the man who filed it — and left everything to you. The company's men call it an accident and offer to buy you out by Friday. You mean to find what's really at the bottom of that shaft first.",
        question: "Who won't sell by Friday?",
        namePlaceholder: "e.g. Verity Trescott",
        names: [
          "Verity Trescott", "Diego Sarmiento", "Jack Penrose", "Ada Mulvaney",
          "Ruben Escalante", "Clementine Voyle", "Owen Trelease", "Paloma Nieto",
          "Abel Hocking", "Rosalie Fairbank", "Nikola Petrich", "Effie Larkin",
          "Manuel Cordero", "Bridget Slaney", "Wyatt Coburn", "Ines Zamora",
        ],
        archetypes: [
          { title: "The Widow", ornament: "☾", blurb: "They expect you to sell and grieve quietly. You'll do one." },
          { title: "The Assayer", ornament: "⚗", blurb: "You know exactly what that ore is worth. So does the company." },
          { title: "The Shift Boss", ornament: "⚒", blurb: "You sent his crew down that morning. You chose the timbering." },
          { title: "The Company Man", ornament: "♦", blurb: "You have a cheque, a deadline, and orders you didn't write." },
          { title: "The Union Organizer", ornament: "⚑", blurb: "Six men died here before him. You counted every one." },
          { title: "The Surveyor", ornament: "✎", blurb: "Your map says the vein runs under land that isn't theirs." },
        ],
        traits: ["Grieving", "Shrewd", "Fearless", "Dogged", "Compromised", "Proud"],
      },
    ],
    question: "Who rides in out of the dust?",
    namePlaceholder: "e.g. Ellis Marner",
    names: [
      "Ellis Marner", "Cassidy Boone", "Jethro Vance", "Della Ríos",
      "Wade Calloway", "Josephine Hart", "Amos Deering", "Rosa Delgado",
      "Silas Crane", "Etta McCue", "Clemente Vargas", "Hattie Fox",
      "Levi Ransom", "Nora Bell", "Gideon Pike", "Marisol Ochoa",
    ],
    archetypes: [
      { title: "The Gunhand", ornament: "✪", blurb: "Fast enough to be famous. Tired enough to quit." },
      { title: "The Circuit Judge", ornament: "⚖", blurb: "You carry the law in a saddlebag. It rides light here." },
      { title: "The Cardsharp", ornament: "♠", blurb: "You win because you must. Someone remembers losing." },
      { title: "The Homesteader", ornament: "⚒", blurb: "They burned the claim. You kept the deed and the anger." },
      { title: "The Printer", ornament: "✎", blurb: "Truth is a lit match in a dry town." },
      { title: "The Preacher", ornament: "✟", blurb: "You buried the gun with your past. This town sells shovels." },
    ],
    traits: ["Weathered", "Loyal", "Vengeful", "Quiet", "Hot-headed", "Honest"],
  },
  {
    id: "romance",
    ornament: "♡",
    genre: "Romance",
    accent: "#D07CA6", // rose
    tone: "Regency romance with intrigue: wit, longing, ballroom politics, secrets behind fans.",
    question: "Who arrives for the Season?",
    namePlaceholder: "e.g. Miss Georgiana Hale",
    names: [
      "Miss Georgiana Hale", "Lady Arabella Finch", "Mr. Percival Grey",
      "Miss Cordelia Wynter", "Captain Frederick Ashworth", "Lady Honoria Vane",
      "Miss Emmeline Carr", "Mr. Julian Ravensworth", "Miss Sophronia Blythe",
      "Lord Edmund Fairfax", "Miss Adelaide Pryce", "Mrs. Rosamund Kell",
      "Mr. Theodore Sinclair", "Miss Beatrix Lovell", "Lady Millicent Rowe",
      "Mr. Augustus Pelham",
    ],
    archetypes: [
      { title: "The Penniless Beauty", ornament: "❧", blurb: "Your face opens doors your accounts would close." },
      { title: "The Widowed Countess", ornament: "♕", blurb: "Married up, buried well. Society calls it luck." },
      { title: "The Secret Novelist", ornament: "✒", blurb: "All London reads your scandals. None suspect the author." },
      { title: "The Half-Pay Officer", ornament: "⚔", blurb: "Waterloo made you a hero. Peace made you poor." },
      { title: "The Matchmaker", ornament: "❁", blurb: "Eleven marriages arranged. Yours remains unwritten." },
      { title: "The Fortune Hunter", ornament: "♠", blurb: "Charm is capital. You mean to invest it well." },
    ],
    traits: ["Witty", "Prudent", "Passionate", "Scheming", "Devoted", "Scandalous"],
    stories: [
      // Story 1 uses the world's Regency cast above.
      { title: "A Season of Masks", premise: "London, 1813. You arrive for the Season with a dazzling reputation, an empty purse, and one chance to secure your family's future — while a rival from your past threatens to expose everything." },
      // Story 2 — contemporary romance, with its own cast.
      {
        title: "The Sunset Clause",
        premise: "You come home to sell your late grandmother's failing vineyard and get on with your city life. The only thing between you and a clean exit is the maddening owner of the rival winery next door — who holds the one contract that could save the place, or finish it.",
        tone: "Contemporary romance: warmth and banter, slow-burn tension, second chances with real stakes under the charm.",
        question: "Who's coming home?",
        namePlaceholder: "e.g. Nora Bennett",
        names: [
          "Nora Bennett", "Diego Alvarez", "Priya Kapoor", "Jack Sullivan",
          "Mei Lin Chen", "Sofia Russo", "Marcus Reid", "Hannah Cole",
          "Andre Okafor", "Isla Fraser", "Danny Moreno", "Cara Whitfield",
          "Sam Delgado", "Ruby Tanaka", "Elliot Shaw", "Vanessa Cruz",
        ],
        archetypes: [
          { title: "The Prodigal", ornament: "☙", blurb: "You left this town at eighteen and swore never to look back." },
          { title: "The One Who Stayed", ornament: "⚓", blurb: "Someone had to keep the lights on. It was always you." },
          { title: "The Rival", ornament: "♦", blurb: "Business is business. Then they walked in." },
          { title: "The Best Friend", ornament: "✿", blurb: "You've loved them quietly for years. Tonight the quiet ends." },
          { title: "The Cynic", ornament: "✖", blurb: "Love is a story other people tell. You know better. Probably." },
          { title: "The Second Chance", ornament: "↺", blurb: "You had them once and lost them. The universe is not subtle." },
        ],
        traits: ["Guarded", "Warm", "Ambitious", "Impulsive", "Loyal", "Restless"],
      },
      // Story 3 — courtly fantasy romance, with its own cast.
      {
        title: "The Enemy's Garden",
        premise: "Two kingdoms that have bled each other for a generation buy peace with a single promise: your hand, given to a stranger across the border you were raised to hate. You are expected to smile, to spy, and above all not to fall for the one person you're forbidden to trust.",
        tone: "Courtly fantasy romance: forbidden longing, political peril, oaths and secrets, a slow burn across enemy lines.",
        question: "Who is promised away?",
        namePlaceholder: "e.g. Seraphine of Aldermoor",
        names: [
          "Seraphine of Aldermoor", "Prince Castien Vayle", "Lady Ianthe Corvin",
          "Amara of the Ninefold Court", "Lord Emeric Thorn", "Sabine Duval",
          "Prince Aleron", "Isolde Fenwick", "Cassius Vane", "Lady Odile Mercer",
          "Bastien Cross", "Vesper Alenko", "Lord Kieran Ash", "Marisol Devereaux",
          "Dorian Frey", "Lady Rosalind Ames",
        ],
        archetypes: [
          { title: "The Reluctant Betrothed", ornament: "❧", blurb: "Promised to a stranger to buy a fragile peace." },
          { title: "The Enemy Prince", ornament: "♛", blurb: "You were meant to hate them. No one warned you they'd be kind." },
          { title: "The Spymaster's Ward", ornament: "♞", blurb: "Sent to gather secrets. You didn't plan to lose your own." },
          { title: "The Sworn Blade", ornament: "⚔", blurb: "You guard their life. You were not asked to guard your heart." },
          { title: "The Claimant", ornament: "♜", blurb: "This marriage restores your claim — and ruins the only thing you want." },
          { title: "The Court Poet", ornament: "✒", blurb: "Both courts sing your verses. Neither knows you wrote the truth." },
        ],
        traits: ["Dutiful", "Rebellious", "Tender", "Guarded", "Bold", "Yearning"],
      },
    ],
  },
];

// Fallback cast for "Write your own" worlds, where we can't know the setting.
const ARCHETYPES = [
  { title: "The Rogue", ornament: "♠", blurb: "Quick hands, quicker wit. Rules are suggestions." },
  { title: "The Scholar", ornament: "✒", blurb: "Knowledge is your weapon — and your weakness." },
  { title: "The Soldier", ornament: "⚔", blurb: "Discipline and steel. You've seen too much." },
  { title: "The Diplomat", ornament: "⚐", blurb: "Words open doors that force never could." },
  { title: "The Outcast", ornament: "☄", blurb: "You belong nowhere, which means you see everything." },
  { title: "The Visionary", ornament: "☉", blurb: "You glimpse what others can't — or won't." },
];

const TRAITS = ["Brave", "Cunning", "Compassionate", "Ruthless", "Curious", "Haunted"];
const DEFAULT_QUESTION = "Who are you?";
// Register-neutral names for "Write your own" worlds.
const DEFAULT_NAMES = [
  "Rowan Ashford", "Mira Okafor", "Kestrel Vance", "Soren Adeyemi",
  "Juno Marlowe", "Cassian Reed", "Lira Nakamura", "Ambrose Cole",
  "Nadia Frost", "Elian Vasquez", "Sable Quinn", "Tobias Wren",
];

const LEGACY_LIB_KEY = "plotwick-library-v1";
const ANON_LIB_KEY = "plotwick-library-anonymous-v2";
const USER_LIB_PREFIX = "plotwick-library-user-v2:";

// ----- state -----
let library = loadLibrary(ANON_LIB_KEY, { migrateLegacy: true });
let story = null; // the active story object (a member of library.stories)
let draft = { scenario: null, character: { name: "", archetype: null, trait: null } };
let pendingAction = null; // player action that led to the chapter now streaming
let generating = false;
let sb = null; // Supabase client (null when accounts aren't configured)
let user = null; // signed-in Supabase user
let appConfig = {}; // /api/config result (creditsEnforced, payments, …)
let credits = null; // current credit balance (null = unknown / not enforced)
let creditAccount = null; // verified balance metadata from the server
let currentUserAdmin = false;
let adminDays = 30;
let pendingStart = false; // user tried to start a story before signing in
let namePool = DEFAULT_NAMES; // name pool for the current world's dice roll
let libraryFilter = "all";
const cloudSaveChains = new Map(); // serialize saves per story to prevent stale writes

// Reading state. The governing rule: while a chapter streams, the page does
// not move. See the "reading scroll" section lower down.
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const VIEW_KEY = "plotwick-reading-view";
let paged = false; // page view vs scroll view
let pageIndex = 0;
let pageTotal = 1;

// ----- helpers -----
const $ = (id) => document.getElementById(id);
const screens = {
  scenario: $("screen-scenario"),
  admin: $("screen-admin"),
  custom: $("screen-custom"),
  character: $("screen-character"),
  story: $("screen-story"),
};

const PRODUCT_SESSION_KEY = "plotwick-product-session-v1";
const PILOT_COHORT_KEY = "plotwick-pilot-cohort-v1";

function pilotCohort() {
  try {
    const requested = new URLSearchParams(window.location.search).get("pilot");
    if (requested && /^[a-zA-Z0-9:_-]{1,80}$/.test(requested)) {
      sessionStorage.setItem(PILOT_COHORT_KEY, requested);
      return requested;
    }
    const saved = sessionStorage.getItem(PILOT_COHORT_KEY);
    return saved && /^[a-zA-Z0-9:_-]{1,80}$/.test(saved) ? saved : null;
  } catch {
    return null;
  }
}

function productSessionId() {
  try {
    let id = sessionStorage.getItem(PRODUCT_SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(PRODUCT_SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

async function trackProductEvent(event, { worldId, storyId, metadata } = {}) {
  try {
    const cohort = pilotCohort();
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        eventId: crypto.randomUUID(),
        event,
        sessionId: productSessionId(),
        worldId: worldId || null,
        storyId: storyId || null,
        metadata: { ...(metadata || {}), ...(cohort ? { pilotCohort: cohort } : {}) },
      }),
      keepalive: true,
    });
  } catch { /* analytics must never interrupt reading */ }
}

function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
  window.scrollTo({ top: 0 });
  if (name !== "story") hideJump();
  document.body.classList.toggle("paged-reading", paged && name === "story");
}

function userLibraryKey(userId) {
  return userId ? `${USER_LIB_PREFIX}${userId}` : ANON_LIB_KEY;
}

function loadLibrary(key = userLibraryKey(user && user.id), { migrateLegacy = false } = {}) {
  try {
    let raw = localStorage.getItem(key);
    if (!raw && migrateLegacy) {
      raw = localStorage.getItem(LEGACY_LIB_KEY);
      if (raw) {
        localStorage.setItem(key, raw);
        localStorage.removeItem(LEGACY_LIB_KEY);
      }
    }
    const lib = JSON.parse(raw);
    if (lib && lib.stories) return lib;
  } catch { /* fall through */ }
  return { version: 1, stories: {} };
}

function saveLibrary() {
  try {
    localStorage.setItem(userLibraryKey(user && user.id), JSON.stringify(library));
  } catch (e) {
    console.warn("couldn't save library:", e);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ----- boot -----
init();

async function init() {
  try {
    appConfig = await fetch("/api/config").then((r) => r.json());
    if (appConfig.demo) $("demo-banner").classList.remove("hidden");
  } catch { /* cosmetic */ }

  renderScenarios();
  renderLibrary();
  wireEvents();
  wirePayments();
  wirePilotFeedback();
  initSupabase(appConfig); // async; UI works without it
  handleCheckoutReturn(); // show a message if we just came back from Stripe
}

// ----- screen 1: home -----
function renderScenarios() {
  const grid = $("scenario-grid");
  grid.innerHTML = "";
  for (const world of SCENARIOS) grid.appendChild(worldCard(world));
  grid.appendChild(customCard());
}

function openSurpriseStory() {
  const world = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  const selectedStory = world.stories[Math.floor(Math.random() * world.stories.length)];
  draft.scenario = buildScenario(world, selectedStory);
  trackProductEvent("world_selected", { worldId: world.id });
  openCharacterScreen();
}

// A world card: shows one of the world's three stories with left/right arrows
// to page through them. The genre, ornament, and accent stay constant; the
// title and premise cycle. Clicking the card chooses the story on show.
function worldCard(world) {
  const card = document.createElement("div");
  card.className = "card scenario-card world-card";
  if (world.accent) card.style.setProperty("--card-accent", world.accent);
  const stories = world.stories;
  let idx = 0;

  const choose = document.createElement("button");
  choose.type = "button";
  choose.className = "world-choose";
  function render() {
    const s = stories[idx];
    const dots = stories.map((_, i) => `<span class="dot${i === idx ? " on" : ""}"></span>`).join("");
    choose.innerHTML =
      `<span class="ornament">${world.ornament}</span>` +
      `<span class="eyebrow">${escapeHtml(world.genre)}</span>` +
      `<h3>${escapeHtml(s.title)}</h3>` +
      `<p>${escapeHtml(s.premise)}</p>` +
      `<span class="story-dots" aria-hidden="true">${dots}</span>`;
  }
  render();
  choose.addEventListener("click", () => {
    draft.scenario = buildScenario(world, stories[idx]);
    trackProductEvent("world_selected", { worldId: world.id });
    openCharacterScreen();
  });

  const arrow = (dir, label, glyph) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `carousel-arrow ${dir}`;
    b.setAttribute("aria-label", label);
    b.textContent = glyph;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      idx = dir === "left" ? (idx - 1 + stories.length) % stories.length : (idx + 1) % stories.length;
      render();
    });
    return b;
  };

  card.append(choose, arrow("left", "Previous story", "‹"), arrow("right", "Next story", "›"));
  return card;
}

function customCard() {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card scenario-card custom-card";
  card.innerHTML =
    `<span class="ornament">☙</span>` +
    `<span class="custom-copy"><span class="eyebrow">Your imagination</span>` +
    `<h3>Write your own</h3><p>Bring a premise; the storyteller does the rest.</p></span>`;
  card.addEventListener("click", () => {
    updateCustomContinue();
    showScreen("custom");
  });
  return card;
}

// Merge a world's shared cast with the chosen story's overrides into the flat
// `scenario` object the rest of the app (and the server) expects.
function buildScenario(world, story) {
  return {
    id: world.id,
    ornament: world.ornament,
    genre: world.genre,
    accent: world.accent,
    title: story.title,
    premise: story.premise,
    tone: story.tone || world.tone,
    question: story.question || world.question,
    namePlaceholder: story.namePlaceholder || world.namePlaceholder,
    archetypes: story.archetypes || world.archetypes,
    traits: story.traits || world.traits,
    names: story.names || world.names,
  };
}

function renderLibrary() {
  const allEntries = Object.values(library.stories).sort((a, b) => b.updatedAt - a.updatedAt);
  const entries = allEntries.filter((st) => (
    libraryFilter === "all" ||
    (libraryFilter === "finished" ? st.done : !st.done)
  ));
  const readingCount = allEntries.filter((st) => !st.done).length;
  const finishedCount = allEntries.length - readingCount;
  $("activation-intro").classList.toggle("hidden", allEntries.length > 0);
  $("activation-shortcut").classList.toggle("hidden", allEntries.length > 0);
  $("worlds-title").textContent = allEntries.length > 0 ? "Choose another world" : "Choose your world";
  $("library-section").classList.toggle("hidden", allEntries.length === 0);
  $("library-summary").textContent =
    `${allEntries.length} ${allEntries.length === 1 ? "story" : "stories"} · ` +
    `${readingCount} in progress · ${finishedCount} finished`;
  document.querySelectorAll("[data-library-filter]").forEach((button) => {
    const active = button.dataset.libraryFilter === libraryFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const grid = $("library-grid");
  grid.innerHTML = "";
  if (entries.length === 0) {
    grid.innerHTML = `<p class="library-empty">${
      libraryFilter === "finished"
        ? "No finished stories yet. Your endings will gather here."
        : "No stories are waiting mid-chapter."
    }</p>`;
    return;
  }
  for (const st of entries) {
    const card = document.createElement("div");
    card.className = "library-card";
    const chapterCount = st.chapters.length;
    const target = Math.max(1, Number(appConfig.targetChapters) || 10);
    const progress = st.done ? 100 : Math.min(92, Math.max(8, Math.round((chapterCount / target) * 100)));
    const coverHtml = st.cover
      ? `<img alt="" src="data:image/svg+xml;utf8,${encodeURIComponent(st.cover)}">`
      : `<span>${st.scenario.ornament || "❦"}</span>`;
    card.innerHTML = `
      <div class="cover">${coverHtml}</div>
      <div class="lib-body">
        <span class="lib-status ${st.done ? "finished" : "reading"}">${st.done ? "Finished" : "In progress"}</span>
        <h3>${escapeHtml(st.title || st.scenario.title)}</h3>
        <p class="lib-meta">${escapeHtml(st.scenario.title)} · ${chapterCount} ${chapterCount === 1 ? "chapter" : "chapters"}</p>
        <div class="lib-progress" role="progressbar" aria-label="Story progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
          <span style="width:${progress}%"></span>
        </div>
        <p class="lib-updated">${formatLibraryDate(st.updatedAt)}</p>
        <div class="lib-actions">
          <button class="btn btn-primary btn-small" data-act="open">${st.done ? "Read" : "Resume"}</button>
          <button class="btn btn-ghost btn-small" data-act="delete">Delete</button>
        </div>
      </div>`;
    card.querySelector('[data-act="open"]').addEventListener("click", () => openStory(st.id));
    card.querySelector('[data-act="delete"]').addEventListener("click", () => {
      if (confirm(`Delete "${st.title || st.scenario.title}" from your library?`)) {
        delete library.stories[st.id];
        saveLibrary();
        cloudDeleteStory(st.id);
        renderLibrary();
      }
    });
    grid.appendChild(card);
  }
}

function formatLibraryDate(timestamp) {
  if (!timestamp) return "Saved in your library";
  const days = Math.floor((Date.now() - timestamp) / 86400000);
  if (days <= 0) return "Read today";
  if (days === 1) return "Read yesterday";
  if (days < 7) return `Read ${days} days ago`;
  return `Read ${new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

// ----- screen 1b: custom scenario -----
function updateCustomContinue() {
  const ok = $("custom-title").value.trim() && $("custom-premise").value.trim();
  $("custom-continue").disabled = !ok;
}

function submitCustomScenario() {
  draft.scenario = {
    id: "custom",
    ornament: "☙",
    genre: "Your own",
    title: $("custom-title").value.trim(),
    premise: $("custom-premise").value.trim(),
    tone: $("custom-tone").value.trim() || "Let the premise suggest the genre; write it with conviction.",
  };
  trackProductEvent("world_selected", { worldId: "custom" });
  openCharacterScreen();
}

// ----- screen 2: character -----
// The cast is world-specific: question, name placeholder, archetypes, and
// traits all come from the chosen world (generic fallbacks for custom ones).
// Selections reset on entry since each world has a different cast.
function openCharacterScreen() {
  const s = draft.scenario;
  $("character-question").textContent = s.question || DEFAULT_QUESTION;
  $("character-scenario-label").textContent = `${s.ornament} ${s.title}`;
  $("character-premise").textContent = s.premise;
  $("char-name").placeholder = s.namePlaceholder || "e.g. Rowan Ashford";
  namePool = (s.names && s.names.length) ? s.names : DEFAULT_NAMES;
  draft.character.archetype = null;
  draft.character.archetypeBlurb = null;
  draft.character.trait = null;
  renderArchetypes(s.archetypes || ARCHETYPES, s.accent);
  renderTraits(s.traits || TRAITS);
  showScreen("character");
  updateBeginButton();
}

function renderArchetypes(archetypes, accent) {
  const grid = $("archetype-grid");
  grid.innerHTML = "";
  for (const a of archetypes) {
    const card = document.createElement("button");
    card.className = "card";
    if (accent) card.style.setProperty("--card-accent", accent);
    card.innerHTML = `<span class="ornament">${a.ornament}</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.blurb)}</p>`;
    card.addEventListener("click", () => {
      draft.character.archetype = a.title;
      draft.character.archetypeBlurb = a.blurb;
      grid.querySelectorAll(".card").forEach((c) => c.classList.toggle("selected", c === card));
      updateBeginButton();
    });
    grid.appendChild(card);
  }
}

function renderTraits(traits) {
  const row = $("trait-row");
  row.innerHTML = "";
  for (const t of traits) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = t;
    chip.addEventListener("click", () => {
      draft.character.trait = t;
      row.querySelectorAll(".chip").forEach((c) => c.classList.toggle("selected", c === chip));
      updateBeginButton();
    });
    row.appendChild(chip);
  }
}

function updateBeginButton() {
  draft.character.name = $("char-name").value.trim();
  const c = draft.character;
  $("begin-btn").disabled = !(c.name && c.archetype && c.trait);
}

// Roll a random name from the current world's pool (never the one already shown).
function rollName() {
  const current = $("char-name").value.trim();
  const pool = namePool.filter((n) => n !== current);
  const name = pool[Math.floor(Math.random() * pool.length)] || namePool[0];
  $("char-name").value = name;
  updateBeginButton();
}

// ----- events -----
function wireEvents() {
  $("surprise-story").addEventListener("click", openSurpriseStory);
  $("library-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-library-filter]");
    if (!button) return;
    libraryFilter = button.dataset.libraryFilter;
    renderLibrary();
  });
  $("char-name").addEventListener("input", updateBeginButton);
  $("roll-name").addEventListener("click", rollName);
  $("back-to-scenarios").addEventListener("click", () => showScreen("scenario"));
  $("custom-back").addEventListener("click", () => showScreen("scenario"));
  ["custom-title", "custom-premise", "custom-tone"].forEach((id) =>
    $(id).addEventListener("input", updateCustomContinue));
  $("custom-continue").addEventListener("click", submitCustomScenario);
  $("logo").addEventListener("click", () => { if (!generating) goHome(); });

  $("begin-btn").addEventListener("click", startStory);
  $("teaser-wall-btn").addEventListener("click", continueFromWall);
  $("new-story-btn").addEventListener("click", goHome);
  $("next-world-btn").addEventListener("click", openAnotherInWorld);
  $("abandon-btn").addEventListener("click", () => {
    if (generating) return;
    if (story && !story.done && !confirm("Leave this story? It stays in your library.")) return;
    goHome();
  });
  $("retry-btn").addEventListener("click", () => {
    $("error-area").classList.add("hidden");
    requestChapter();
  });

  $("custom-action-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const action = $("custom-action").value.trim();
    if (action) chooseAction(action, true);
  });

  $("journal-toggle").addEventListener("click", () => {
    const j = $("journal");
    const show = j.classList.contains("hidden");
    j.classList.toggle("hidden", !show);
    $("journal-toggle").setAttribute("aria-pressed", String(show));
  });

  $("jump-to-choices").addEventListener("click", jumpToReady);
  window.addEventListener("scroll", onReadScroll, { passive: true });

  // ----- page view -----
  $("view-toggle").addEventListener("click", () => setView(!paged));
  $("page-next").addEventListener("click", nextPage);
  $("page-prev").addEventListener("click", prevPage);

  document.addEventListener("keydown", (e) => {
    if (!paged || screens.story.classList.contains("hidden")) return;
    if (/^(input|textarea)$/i.test(e.target.tagName)) return;
    if (["ArrowRight", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey)) { e.preventDefault(); nextPage(); }
    else if (["ArrowLeft", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) { e.preventDefault(); prevPage(); }
  });

  // swipe to turn
  let swipeX = null, swipeY = null;
  const readerEl = $("reader");
  readerEl.addEventListener("touchstart", (e) => {
    if (!paged || !e.touches[0]) return;
    swipeX = e.touches[0].clientX; swipeY = e.touches[0].clientY;
  }, { passive: true });
  readerEl.addEventListener("touchend", (e) => {
    if (!paged || swipeX == null || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - swipeX;
    const dy = e.changedTouches[0].clientY - swipeY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? nextPage : prevPage)();
    swipeX = swipeY = null;
  }, { passive: true });

  // A resized or rotated screen re-paginates, holding the reader's chapter.
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    onReadScroll();
    if (!paged) return;
    clearTimeout(resizeTimer);
    const keep = lastChapterEl();
    resizeTimer = setTimeout(() => layoutPages(keep), 140);
  }, { passive: true });

  $("share-btn").addEventListener("click", shareStory);
  $("copy-link-btn").addEventListener("click", async () => {
    const input = $("share-link");
    input.select();
    try { await navigator.clipboard.writeText(input.value); } catch { document.execCommand("copy"); }
    $("copy-link-btn").textContent = "Copied";
    setTimeout(() => { $("copy-link-btn").textContent = "Copy"; }, 1500);
  });
}

function goHome() {
  story = null;
  renderLibrary();
  showScreen("scenario");
}

// A signed-out visitor may read one live first chapter of a built-in story
// before the wall, so they can see our actual prose with their own character in
// it. The server decides for real (and owns the rate limits); this only avoids
// starting a story we already know will be refused. Custom premises are
// excluded here for the same reason the server excludes them: an anonymous
// visitor must not get to put an arbitrary premise in front of the model.
function teaserEligible() {
  return !!appConfig.teaserEnabled &&
    !user &&
    !!draft.scenario &&
    draft.scenario.id !== "custom";
}

// ----- story lifecycle -----
function startStory() {
  updateBeginButton();
  if ($("begin-btn").disabled) return;

  // When credits are enforced, a story requires a signed-in account with at
  // least one credit. Guide the player to sign in / top up before we build the
  // story object, and remember their intent so we can resume automatically.
  if (appConfig.authRequired || appConfig.creditsEnforced) {
    if (!user && !teaserEligible()) {
      pendingStart = true;
      authMessage("Sign in or create a free account to begin — your first Wick is on the house.", true);
      openAuthModal();
      return;
    }
    if (appConfig.creditsEnforced && credits !== null && credits !== "unlimited" && credits <= 0) {
      openBuyModal();
      return;
    }
  }

  trackProductEvent("setup_completed", { worldId: draft.scenario.id });
  story = {
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serverId: null,
    startToken: crypto.randomUUID(),
    // Set while this is an unclaimed teaser: chapter one is readable but the
    // choices stay locked until the reader signs in and the story is adopted.
    // Cleared by adoptTeaser(); the token is what proves the chapter is ours.
    teaserPending: !user,
    teaserToken: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scenario: draft.scenario,
    character: { ...draft.character },
    history: [
      {
        role: "user",
        content: "Begin the story. Write the opening chapter and introduce the protagonist in the middle of their world.",
      },
    ],
    chapters: [],
    title: null,
    cover: null,
    state: null,
    done: false,
  };
  library.stories[story.id] = story;
  pendingAction = null;
  openStoryScreen();
  requestChapter();
}

function openStory(id) {
  story = library.stories[id];
  if (!story) return;
  pendingAction = null;
  openStoryScreen();
  renderAllChapters();
  updateJournal(story.state);
  if (story.done) {
    $("ending-area").classList.remove("hidden");
    renderEndingRitual();
    updateShareControls();
  } else {
    const last = [...story.history].reverse().find((m) => m.role === "assistant");
    const choices = last ? parseChoices(last.content) : null;
    if (last) showChoices(choices);
    else requestChapter();
  }
}

function openStoryScreen() {
  $("story-title").textContent = story.title || `${story.scenario.title} · ${story.character.name}`;
  detachFromBook(); // never let a clear take the choices' listeners with it
  $("story-text").innerHTML = "";
  $("choices-area").classList.add("hidden");
  $("ending-area").classList.add("hidden");
  $("share-result").classList.add("hidden");
  $("error-area").classList.add("hidden");
  $("journal").classList.add("hidden");
  $("journal-toggle").setAttribute("aria-pressed", "false");
  // Tint the whole reading view with this world's accent (custom → house gold).
  const el = $("screen-story");
  if (story.scenario.accent) el.style.setProperty("--story-accent", story.scenario.accent);
  else el.style.removeProperty("--story-accent");
  updateChapterCount();
  showScreen("story");
  // Restore the reader's preferred view, then size the page to this screen.
  let saved = null;
  try { saved = localStorage.getItem(VIEW_KEY); } catch { /* ignore */ }
  setView(saved === "paged", false);
}

function chooseAction(action, isCustom) {
  $("custom-action").value = "";
  hideChoices();
  appendPlayerAction(action);
  pendingAction = action;
  story.history.push({
    role: "user",
    content: isCustom
      ? `The player writes their own action: "${action}". Honor it within the fiction.`
      : `The player chooses: "${action}"`,
  });
  requestChapter();
}

async function requestChapter() {
  generating = true;
  $("typing-indicator").classList.remove("hidden");
  $("error-area").classList.add("hidden");

  const proseEl = document.createElement("div");
  proseEl.className = "chapter";
  $("story-text").appendChild(proseEl);
  anchorToChapter(proseEl); // one deliberate move, then the page holds still

  let fullText = "";
  let failed = null;

  try {
    const res = await fetch("/api/story", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        storyId: story.serverId || null,
        startToken: story.serverId ? null : (story.startToken ||= crypto.randomUUID()),
        sessionId: productSessionId(),
        worldId: story.scenario.id,
        scenario: {
          title: story.scenario.title,
          premise: story.scenario.premise,
          tone: story.scenario.tone,
        },
        character: story.character,
        history: story.history,
      }),
    });
    if (res.status === 402) {
      // Out of credits — offer to buy more.
      const body = await res.json().catch(() => ({}));
      setCredits(0);
      generating = false;
      $("typing-indicator").classList.add("hidden");
      proseEl.remove();
      openBuyModal();
      return;
    }
    if (res.status === 401) {
      generating = false;
      $("typing-indicator").classList.add("hidden");
      proseEl.remove();
      pendingStart = true;
      openAuthModal();
      return;
    }
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error("rate limited"), { userMessage: body.error });
    }
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error("story conflict"), {
        userMessage: body.error || "This story changed elsewhere. Return home and reload it before retrying.",
      });
    }
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 2);
        if (!line.startsWith("data: ")) continue;
        const evt = JSON.parse(line.slice(6));
        if (evt.type === "text") {
          fullText += evt.text;
          renderProse(proseEl, visiblePart(fullText));
          noteTextGrew(); // page view: the book gets longer, the reader stays put
        } else if (evt.type === "credits") {
          setCredits(evt.credits);
        } else if (evt.type === "story") {
          story.serverId = evt.storyId;
          persistStory(story);
        } else if (evt.type === "teaser") {
          // A free, unowned chapter. The throwaway id the server sent with it
          // is not a real session, so drop it — keeping it would make the next
          // request look like a continuation and 409.
          story.serverId = null;
          story.teaserPending = true;
          story.teaserToken = evt.token;
          persistStory(story);
        } else if (evt.type === "story-reset") {
          story.serverId = null;
          persistStory(story);
        } else if (evt.type === "error") {
          failed = evt.error;
        }
      }
    }
  } catch (err) {
    console.error(err);
    failed = err.userMessage || "Couldn't reach the storyteller. Check your connection and try again.";
  }

  generating = false;
  $("typing-indicator").classList.add("hidden");
  releaseReserve(); // the chapter is written; hand the reserved height back
  hideJump(); // showChoices/finishStory will re-offer it if anything waits below

  if (failed || !fullText.trim()) {
    proseEl.remove();
    showError(failed || "The storyteller returned an empty page. Try again.");
    if (appConfig.creditsEnforced) refreshCredits(); // a failed first chapter is refunded
    return;
  }

  // Commit the chapter.
  const prose = visiblePart(fullText);
  story.history.push({ role: "assistant", content: fullText });
  story.chapters.push({ prose, action: pendingAction });
  pendingAction = null;

  const ledger = parseLedger(fullText);
  if (ledger) {
    story.state = ledger;
    if (ledger.title) {
      const firstTime = !story.title;
      story.title = ledger.title;
      if (firstTime) fetchCover(); // async; fills in when ready
    }
    $("story-title").textContent = story.title || $("story-title").textContent;
    updateJournal(ledger);
  }

  story.updatedAt = Date.now();
  persistStory(story);
  updateChapterCount();

  showChoices(parseChoices(fullText));
}

// ----- parsing -----
function visiblePart(fullText) {
  return fullText.split(/<state>|<choices>/)[0].trimEnd();
}

function parseLedger(text) {
  const m = text.match(/<state>\s*([\s\S]*?)\s*<\/state>/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    if (!obj || typeof obj !== "object" || ![1, 2, 3].includes(obj.act)) return null;
    const short = (value, max) => typeof value === "string" ? value.slice(0, max) : "";
    return {
      title: short(obj.title, 200),
      act: obj.act,
      condition: short(obj.condition, 200),
      inventory: Array.isArray(obj.inventory)
        ? obj.inventory.filter((v) => typeof v === "string").slice(0, 20).map((v) => v.slice(0, 120))
        : [],
      companions: Array.isArray(obj.companions)
        ? obj.companions.filter((v) => v && typeof v === "object").slice(0, 12).map((v) => ({
            name: short(v.name, 100),
            standing: short(v.standing, 60),
          }))
        : [],
      threads: Array.isArray(obj.threads)
        ? obj.threads.filter((v) => typeof v === "string").slice(0, 5).map((v) => v.slice(0, 240))
        : [],
    };
  } catch {
    return null;
  }
}

function parseChoices(text) {
  const m = text.match(/<choices>\s*(\[[\s\S]*?\])\s*<\/choices>/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[1]);
    if (!Array.isArray(arr) || ![0, 3].includes(arr.length)) return null;
    if (arr.some((c) => typeof c !== "string" || !c.trim() || c.length > 200)) return null;
    return arr.map((c) => c.trim());
  } catch {
    return null;
  }
}

// ----- choices & endings -----
function showChoices(choices) {
  if (choices && choices.length === 0) {
    finishStory();
    return;
  }
  const walled = isTeaserWalled();
  const btns = $("choice-buttons");
  btns.innerHTML = "";
  // If the model flubbed the format, offer a neutral continue.
  for (const choice of choices && choices.length ? choices : ["Continue"]) {
    const b = document.createElement("button");
    b.className = "choice-btn";
    b.textContent = choice;
    if (walled) {
      // Readable, not clickable. The tension of a choice you can see but can't
      // make yet is doing the work here.
      b.disabled = true;
      b.setAttribute("aria-describedby", "teaser-wall");
    } else {
      b.addEventListener("click", () => chooseAction(choice, false));
    }
    btns.appendChild(b);
  }
  $("teaser-wall").classList.toggle("hidden", !walled);
  $("custom-action-form").classList.toggle("hidden", walled);
  $("choices-area").classList.remove("hidden");
  // In page view the choices become the chapter's final page — the reader turns
  // to them when they're ready, so they can't be read ahead of the prose.
  if (paged) { attachToBook($("choices-area")); requestAnimationFrame(countPages); }
  offerJump();
}

function hideChoices() {
  $("choices-area").classList.add("hidden");
  $("teaser-wall").classList.add("hidden");
  $("custom-action-form").classList.remove("hidden");
  // In page view the choices were the final page of the chapter that just
  // ended. Take that page out of the book before appending the player's action
  // and the next chapter. Otherwise revealing the same element later inserts
  // the new choices before the chapter and reflows the page under the reader.
  if (paged) detachFromBook();
}

// True while the reader is looking at a free chapter they haven't claimed yet.
// A signed-in reader is never walled — if they somehow arrive here with a stale
// teaser flag, adoption resolves it rather than trapping them.
function isTeaserWalled() {
  return !!(story && story.teaserPending && !user);
}

// Turn the free chapter into a real story. This is the moment the Wick is
// spent: the reader is buying the story they are already inside, not a credit.
// On success the story is ordinary, and every later chapter goes through the
// normal path.
async function adoptTeaser() {
  if (!story || !story.teaserPending || !user) return true;
  const opening = story.history[0] && story.history[0].content;
  const chapter = story.history[1] && story.history[1].content;
  if (!opening || !chapter || !story.teaserToken) {
    // Nothing redeemable — fall back to beginning the story properly.
    story.teaserPending = false;
    story.teaserToken = null;
    return true;
  }
  const res = await fetch("/api/story/adopt", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify({
      scenario: {
        title: story.scenario.title,
        premise: story.scenario.premise,
        tone: story.scenario.tone,
      },
      character: story.character,
      opening,
      chapter,
      teaserToken: story.teaserToken,
      startToken: story.startToken,
      sessionId: productSessionId(),
      worldId: story.scenario.id,
    }),
  });
  if (res.status === 402) {
    openBuyModal();
    return false;
  }
  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    if (body.teaserInvalid) {
      // The signature no longer verifies — expired, or the saved chapter was
      // edited. Drop the preview and let them start the story for real.
      story.history = story.history.slice(0, 1);
      story.chapters = [];
      story.teaserPending = false;
      story.teaserToken = null;
      persistStory(story);
      return true;
    }
    return false;
  }
  if (!res.ok) return false;
  const body = await res.json();
  story.serverId = body.storyId;
  story.teaserPending = false;
  story.teaserToken = null;
  setCredits(body.credits);
  persistStory(story);
  return true;
}

// Re-render the last chapter's choices now that they're unlocked, leaving the
// prose exactly where it is. The reader picks up on the same decision they were
// looking at when they signed in.
function resumeAfterAuth() {
  if (!story) return;
  const last = [...story.history].reverse().find((m) => m.role === "assistant");
  if (!last) {
    requestChapter();
    return;
  }
  showChoices(parseChoices(last.content));
}

// The wall's only button: sign in, then continue where they stopped reading.
async function continueFromWall() {
  if (user) {
    if (await adoptTeaser()) resumeAfterAuth();
    return;
  }
  pendingStart = true;
  authMessage("Create a free account to keep going — your first Wick is on the house.", true);
  openAuthModal();
}

function finishStory() {
  story.done = true;
  story.updatedAt = Date.now();
  persistStory(story);
  trackProductEvent("story_completed", {
    worldId: story.scenario.id,
    storyId: story.serverId || story.id,
    metadata: { chapterCount: story.chapters.length },
  });
  $("ending-area").classList.remove("hidden");
  renderEndingRitual();
  updateShareControls();
  if (paged) { attachToBook($("ending-area")); requestAnimationFrame(countPages); }
  offerJump();
}

function renderEndingRitual() {
  if (!story) return;
  const count = story.chapters.length;
  $("ending-summary").textContent =
    `${story.character.name}'s story now rests in your library after ${count} ` +
    `${count === 1 ? "chapter" : "chapters"}. Return whenever you want to read it again.`;
  const world = SCENARIOS.find((candidate) => candidate.id === story.scenario.id);
  $("next-world-btn").classList.toggle("hidden", !world || world.stories.length < 2);
}

function openAnotherInWorld() {
  if (!story || !story.done) return;
  const world = SCENARIOS.find((candidate) => candidate.id === story.scenario.id);
  if (!world) return goHome();
  const alternatives = world.stories.filter((candidate) => candidate.title !== story.scenario.title);
  const selectedStory = alternatives[Math.floor(Math.random() * alternatives.length)] || world.stories[0];
  story = null;
  draft.scenario = buildScenario(world, selectedStory);
  openCharacterScreen();
}

function showError(msg) {
  $("error-text").textContent = msg;
  $("error-area").classList.remove("hidden");
}

// ----- sharing -----
async function shareStory() {
  if (!story) return;
  $("share-btn").disabled = true;
  try {
    if (story.shareId) {
      if (!confirm("Unpublish this story? Its public link will stop working.")) {
        $("share-btn").disabled = false;
        return;
      }
      const revoke = await fetch(`/api/share/${encodeURIComponent(story.shareId)}`, {
        method: "DELETE",
        headers: await authHeader(),
      });
      if (!revoke.ok) throw new Error(`HTTP ${revoke.status}`);
      story.shareId = null;
      story.updatedAt = Date.now();
      persistStory(story);
      $("share-result").classList.add("hidden");
      updateShareControls();
      $("share-btn").disabled = false;
      return;
    }
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        title: story.title || story.scenario.title,
        scenario: { title: story.scenario.title },
        character: story.character,
        chapters: story.chapters,
        cover: story.cover,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { id } = await res.json();
    story.shareId = id;
    story.updatedAt = Date.now();
    persistStory(story);
    $("share-link").value = `${location.origin}/s/${id}`;
    $("share-result").classList.remove("hidden");
    updateShareControls();
  } catch (err) {
    console.error(err);
    alert("Couldn't publish the story right now. Try again in a moment.");
  }
  $("share-btn").disabled = false;
}

function updateShareControls() {
  if (!story) return;
  $("share-btn").textContent = story.shareId ? "Unpublish story" : "Share this story";
  if (story.shareId) {
    $("share-link").value = `${location.origin}/s/${story.shareId}`;
    $("share-result").classList.remove("hidden");
  }
}

// ----- cover art -----
async function fetchCover() {
  if (!story || story.cover || !story.title) return;
  const forStory = story;
  try {
    const res = await fetch("/api/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        title: forStory.title,
        scenario: { title: forStory.scenario.title, premise: forStory.scenario.premise },
        character: forStory.character,
        accent: forStory.scenario.accent || null,
      }),
    });
    const { svg } = await res.json();
    if (svg) {
      forStory.cover = svg;
      forStory.updatedAt = Date.now();
      persistStory(forStory);
    }
  } catch (err) {
    console.warn("cover fetch failed:", err);
  }
}

// ----- journal -----
function updateJournal(ledger) {
  if (!ledger) return;
  $("j-condition").textContent = ledger.condition || "—";
  const inv = $("j-inventory");
  inv.innerHTML = (ledger.inventory || []).length
    ? ledger.inventory.map((i) => `<li>${escapeHtml(i)}</li>`).join("")
    : "<li>—</li>";
  const comp = $("j-companions");
  comp.innerHTML = (ledger.companions || []).length
    ? ledger.companions.map((c) => `<li>${escapeHtml(c.name || "")} <span class="standing">${escapeHtml(c.standing || "")}</span></li>`).join("")
    : "<li>—</li>";
}

// ----- rendering -----
// The narrator occasionally reaches for markdown emphasis — a ship's name in
// *italics*. Rendered raw those asterisks land on the page as punctuation, so
// convert the simple cases after escaping (never before: escaping first is what
// keeps this safe).
function inlineEmphasis(escaped) {
  return escaped
    .replace(/\*\*(?!\s)([^*\n]+?)(?<!\s)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(["'])\*(?!\s)([^*\n]+?)(?<!\s)\*(?=$|[\s.,;:!?)\]"'])/g, "$1<em>$2</em>")
    .replace(/(^|[\s(["'])_(?!\s)([^_\n]+?)(?<!\s)_(?=$|[\s.,;:!?)\]"'])/g, "$1<em>$2</em>");
}

function renderProse(el, text) {
  el.innerHTML = text
    .split(/\n{2,}/)
    .map((p) => `<p>${inlineEmphasis(escapeHtml(p)).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function appendPlayerAction(action) {
  const div = document.createElement("div");
  div.innerHTML = `<p class="player-action">${escapeHtml(action)}</p><p class="asterism">⁂</p>`;
  $("story-text").appendChild(div);
}

function renderAllChapters() {
  const container = $("story-text");
  detachFromBook();
  container.innerHTML = "";
  for (const ch of story.chapters) {
    if (ch.action) {
      const div = document.createElement("div");
      div.innerHTML = `<p class="player-action">${escapeHtml(ch.action)}</p><p class="asterism">⁂</p>`;
      container.appendChild(div);
    }
    const el = document.createElement("div");
    el.className = "chapter";
    renderProse(el, ch.prose);
    container.appendChild(el);
  }
  // Reopen a finished story at its first page; reopen one in progress at the
  // top of its latest chapter, which is where the reader left off.
  const chapters = container.querySelectorAll(".chapter");
  const last = chapters[chapters.length - 1];
  if (paged) {
    window.scrollTo({ top: 0 });
    layoutPages(story.done ? null : last);
    if (story.done) goToPage(0, true);
    return;
  }
  if (story.done || !last) window.scrollTo({ top: 0 });
  else window.scrollTo({ top: Math.max(0, last.getBoundingClientRect().top + window.scrollY - HEADROOM) });
}

function updateChapterCount() {
  const n = story ? story.chapters.length : 0;
  $("chapter-count").textContent = n ? `Chapter ${n}` : "";
}

// ----- reading scroll: the page holds still -----
// One rule: text arriving must never move the reader. The page scrolls exactly
// twice, and both times because the reader just acted —
//   1. they pick a choice, so we bring the new chapter's first line into view;
//   2. they click the "Chapter ready" pill, so we take them to the choices.
// Nothing else scrolls. No rAF loop, no follow, no auto-scroll.

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

const smooth = () => (REDUCED_MOTION ? "auto" : "smooth");

// ---------- page view ----------
// The reader is a fixed-height window and the prose is laid out as columns the
// width of that window, slid sideways one page at a time. The browser does the
// line breaking, so a page always fits the screen it is being read on, and text
// arriving simply extends the book to the right — it never moves the reader.

const PAGE_MAX_WIDTH = 620; // keep the measure readable on wide screens

// In page view the choices are not a panel under the page — they are the last
// page of the chapter, the way a gamebook puts them at the foot of the section.
// So they cannot spoil what you are still reading, and the prose gets the screen.
function furnitureHome() { return screens.story; }

function attachToBook(el) {
  if (!paged || !el) return;
  const book = $("story-text");
  // appendChild also moves an existing child. That is intentional: furniture
  // such as the reusable choices panel must always follow all current prose.
  if (el.parentElement !== book || el !== book.lastElementChild) book.appendChild(el);
}

// Take the choices/ending back out of the paginated track. Must happen before
// anything clears the track, or their listeners go with it.
function detachFromBook() {
  const s = furnitureHome();
  const choices = $("choices-area"), ending = $("ending-area"), err = $("error-area");
  if (ending.parentElement !== s) s.insertBefore(ending, err);
  if (choices.parentElement !== s) s.insertBefore(choices, ending);
}

function pageGeometry() {
  const text = $("story-text");
  const cs = getComputedStyle(text);
  const w = parseFloat(cs.width) || 1;
  const gap = parseFloat(cs.columnGap) || 0;
  return { w, gap, stride: w + gap };
}

function countPages() {
  const text = $("story-text");
  const { stride, gap } = pageGeometry();
  const measuredTotal = Math.max(1, Math.round((text.scrollWidth + gap) / stride));
  // renderProse replaces the streaming chapter's markup on every text event.
  // A measurement can briefly report fewer columns while the browser reflows.
  // Never respond by pulling the reader backward; the current page remains a
  // valid part of the book until generation has settled.
  pageTotal = generating ? Math.max(measuredTotal, pageIndex + 1) : measuredTotal;
  if (!generating && pageIndex > pageTotal - 1) pageIndex = pageTotal - 1;
  renderPager();
}

function renderPager() {
  if (!paged) return;
  $("page-count").textContent = `${pageIndex + 1} / ${pageTotal}`;
  $("page-prev").disabled = pageIndex <= 0;
  $("page-next").disabled = pageIndex >= pageTotal - 1;
  $("reader").style.setProperty("--page-i", String(pageIndex));
}

function layoutPages(keepEl) {
  if (!paged) return;
  const reader = $("reader");
  reader.style.removeProperty("--page-h");
  const top = reader.getBoundingClientRect().top;
  // visualViewport tracks the space a mobile browser's chrome actually leaves.
  const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  const below = ($("pager").offsetHeight || 40) + 20;
  const h = Math.max(260, Math.floor(vh - top - below));
  // measure the space from the parent: the frame itself is pinned to one page
  const avail = (reader.parentElement || reader).clientWidth;
  const w = Math.floor(Math.min(avail, PAGE_MAX_WIDTH));
  reader.style.setProperty("--page-h", `${h}px`);
  reader.style.setProperty("--page-w", `${w}px`);
  // let the new geometry settle before measuring columns
  requestAnimationFrame(() => {
    countPages();
    if (keepEl) goToPage(pageOfElement(keepEl), true);
    else renderPager();
  });
}

// Which page does this element begin on? Both rects carry the same transform,
// so the difference between them is a position in untransformed track space.
function pageOfElement(el) {
  if (!el) return 0;
  const { stride } = pageGeometry();
  const x = el.getBoundingClientRect().left - $("story-text").getBoundingClientRect().left;
  return Math.max(0, Math.min(pageTotal - 1, Math.round(x / stride)));
}

function goToPage(i, instant) {
  const text = $("story-text");
  if (instant && !REDUCED_MOTION) {
    text.style.transition = "none";
    requestAnimationFrame(() => { text.style.transition = ""; });
  }
  pageIndex = Math.max(0, Math.min(i, pageTotal - 1));
  renderPager();
}

const nextPage = () => goToPage(pageIndex + 1);
const prevPage = () => goToPage(pageIndex - 1);

function setView(on, persist = true) {
  paged = !!on;
  const here = lastChapterEl();
  $("view-toggle").setAttribute("aria-pressed", String(paged));
  $("view-toggle").textContent = paged ? "Scroll view" : "Page view";
  $("reader").classList.toggle("paged", paged);
  $("pager").classList.toggle("hidden", !paged);
  // In page view the masthead steps aside so the page gets the screen.
  document.body.classList.toggle("paged-reading", paged && !screens.story.classList.contains("hidden"));
  if (persist) { try { localStorage.setItem(VIEW_KEY, paged ? "paged" : "scroll"); } catch { /* ignore */ } }
  if (paged) {
    hideJump();
    $("story-text").classList.remove("reserving");
    $("story-text").style.paddingBottom = "";
    window.scrollTo({ top: 0 });
    // whatever is currently waiting becomes the last page
    if (!$("choices-area").classList.contains("hidden")) attachToBook($("choices-area"));
    if (!$("ending-area").classList.contains("hidden")) attachToBook($("ending-area"));
    layoutPages(here);
  } else {
    detachFromBook();
    $("reader").style.removeProperty("--page-h");
    $("reader").style.removeProperty("--page-w");
    if (here) here.scrollIntoView({ block: "start" });
  }
}

const lastChapterEl = () => {
  const all = $("story-text").querySelectorAll(".chapter");
  return all[all.length - 1] || null;
};

// While a chapter streams, the book grows to the right. Recount, but never move.
let recountQueued = false;
function noteTextGrew() {
  if (!paged || recountQueued) return;
  recountQueued = true;
  requestAnimationFrame(() => { recountQueued = false; countPages(); });
}

const HEADROOM = 96; // breathing room under the running head

// A new chapter is about to stream. Put its opening line where the eye starts,
// just below the running head — then leave the page alone until the reader acts.
// The page can only scroll that far if there is room beneath, and a chapter that
// hasn't been written yet has none, so we reserve a screen's worth first.
function anchorToChapter(el) {
  hideJump();
  if (paged) {
    // A book turns to the chapter's first page.
    requestAnimationFrame(() => { countPages(); goToPage(pageOfElement(el)); });
    return;
  }
  const text = $("story-text");
  text.style.paddingBottom = "";
  text.classList.add("reserving");
  requestAnimationFrame(() => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, Math.min(top - HEADROOM, maxScroll())), behavior: smooth() });
  });
}

// The chapter is written, so the reserve can go — but giving the height back
// must not tug the reader upward. Keep exactly as much as their position needs.
function releaseReserve() {
  const text = $("story-text");
  if (paged || !text.classList.contains("reserving")) return;
  const keep = window.scrollY;
  text.classList.remove("reserving");
  text.style.paddingBottom = "";
  const overflow = keep - maxScroll();
  if (overflow > 0) text.style.paddingBottom = `${Math.ceil(overflow)}px`;
  window.scrollTo(0, keep);
}

// The chapter has finished writing. If what's now ready sits below the fold,
// say so — quietly, in a corner — and wait to be clicked. Never scroll for them.
function offerJump() {
  if (paged) return hideJump(); // in page view nothing is ever below the fold
  const target = $("ending-area").classList.contains("hidden") ? $("choices-area") : $("ending-area");
  if (!target || target.classList.contains("hidden")) return hideJump();
  const rect = target.getBoundingClientRect();
  const below = rect.top > window.innerHeight - 40;
  const pill = $("jump-to-choices");
  if (!pill) return;
  pill.textContent = story && story.done ? "The End ↓" : "Chapter ready ↓";
  pill.classList.toggle("hidden", !below);
}

function hideJump() {
  const pill = $("jump-to-choices");
  if (pill) pill.classList.add("hidden");
}

// Reader-initiated: take them to whatever is waiting.
function jumpToReady() {
  const target = $("ending-area").classList.contains("hidden") ? $("choices-area") : $("ending-area");
  if (target) target.scrollIntoView({ behavior: smooth(), block: "center" });
  hideJump();
}

// As they read down, the pill retires itself once the waiting content is in view.
function onReadScroll() {
  if ($("jump-to-choices") && !$("jump-to-choices").classList.contains("hidden")) offerJump();
}

// ----- accounts & cloud library (Supabase) -----
// Loaded only when the server reports Supabase config; without it the app
// runs exactly as before, with the library in localStorage alone.

async function initSupabase(cfg) {
  if (!cfg.supabase) return;
  try {
    await loadScript("/vendor/supabase.js"); // vendored @supabase/supabase-js UMD build
    sb = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
  } catch (err) {
    console.warn("Supabase unavailable:", err);
    return;
  }

  $("account-bar").classList.remove("hidden");
  wireAuthEvents();

  sb.auth.onAuthStateChange((_event, session) => setUser(session ? session.user : null));
  const { data } = await sb.auth.getSession();
  setUser(data.session ? data.session.user : null);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function wireAuthEvents() {
  $("account-btn").addEventListener("click", () => {
    if (user) {
      openAccountModal();
    } else {
      openAuthModal();
    }
  });
  $("auth-close").addEventListener("click", closeAuthModal);
  $("auth-modal").addEventListener("click", (e) => {
    if (e.target === $("auth-modal")) closeAuthModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAuthModal();
      closeAccountModal();
    }
  });
  $("signin-btn").addEventListener("click", () => submitAuth("signin"));
  $("signup-btn").addEventListener("click", () => submitAuth("signup"));
  $("auth-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAuth("signin");
  });
  $("account-close").addEventListener("click", closeAccountModal);
  $("account-modal").addEventListener("click", (e) => {
    if (e.target === $("account-modal")) closeAccountModal();
  });
  $("signout-btn").addEventListener("click", async () => {
    closeAccountModal();
    await sb.auth.signOut();
  });
  $("export-account-btn").addEventListener("click", exportAccountData);
  $("delete-account-btn").addEventListener("click", deleteAccount);
  $("admin-btn").addEventListener("click", openAdminDashboard);
  $("admin-back").addEventListener("click", goHome);
  $("admin-range").addEventListener("click", (event) => {
    const button = event.target.closest("[data-days]");
    if (!button) return;
    adminDays = Number(button.dataset.days) || 30;
    $("admin-range").querySelectorAll("[data-days]").forEach((candidate) => {
      candidate.classList.toggle("selected", candidate === button);
    });
    loadAdminDashboard();
  });
}

function openAuthModal() {
  $("auth-title").textContent = pendingStart ? "Save your place, then begin" : "Your library, anywhere";
  $("auth-sub").textContent = pendingStart
    ? "Create a free account or sign in. Your world and character are waiting."
    : "Sign in and your stories follow you across devices.";
  $("auth-message").classList.add("hidden");
  $("auth-modal").classList.remove("hidden");
  $("auth-email").focus();
}

function closeAuthModal() {
  $("auth-modal").classList.add("hidden");
}

function openAccountModal() {
  if (!user) return;
  $("account-modal-email").textContent = user.email || "";
  $("account-message").classList.add("hidden");
  $("account-modal").classList.remove("hidden");
}

function closeAccountModal() {
  $("account-modal").classList.add("hidden");
}

function accountMessage(text, gentle) {
  const el = $("account-message");
  el.textContent = text;
  el.classList.toggle("gentle", !!gentle);
  el.classList.remove("hidden");
}

async function exportAccountData() {
  const button = $("export-account-btn");
  button.disabled = true;
  try {
    const res = await fetch("/api/account/export", { headers: await authHeader() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plotwick-export.json";
    link.click();
    URL.revokeObjectURL(url);
    accountMessage("Your export has been downloaded.", true);
  } catch {
    accountMessage("Couldn't export your data. Please try again.");
  } finally {
    button.disabled = false;
  }
}

async function deleteAccount() {
  if (!user) return;
  const confirmation = prompt(
    "This permanently deletes your account, cloud stories, and public shares. Type DELETE to continue.",
  );
  if (confirmation !== "DELETE") return;
  const button = $("delete-account-btn");
  button.disabled = true;
  try {
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ confirmation }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const deletedUserId = user.id;
    localStorage.removeItem(userLibraryKey(deletedUserId));
    closeAccountModal();
    await sb.auth.signOut();
    toast("Your Plotwick account and cloud data were deleted.");
  } catch {
    accountMessage("Couldn't delete the account. Please try again.");
    button.disabled = false;
  }
}

async function submitAuth(mode) {
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  if (!email || !password) {
    return authMessage("Enter your email and a password.");
  }
  $("signin-btn").disabled = $("signup-btn").disabled = true;
  try {
    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return authMessage(error.message);
      if (!data.session) {
        return authMessage("Almost there — check your email to confirm your account, then sign in.", true);
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return authMessage(error.message);
    }
    closeAuthModal();
  } finally {
    $("signin-btn").disabled = $("signup-btn").disabled = false;
  }
}

function authMessage(text, gentle) {
  const el = $("auth-message");
  el.textContent = text;
  el.classList.toggle("gentle", !!gentle);
  el.classList.remove("hidden");
}

function setUser(u) {
  const previousUser = user;
  const changed = (u && u.id) !== (previousUser && previousUser.id);
  if (changed) {
    currentUserAdmin = false;
    $("admin-btn").classList.add("hidden");
    saveLibrary();
    user = u;
    if (u) {
      const accountLibrary = loadLibrary(userLibraryKey(u.id));
      const anonymousLibrary = loadLibrary(ANON_LIB_KEY);
      const anonymousStories = Object.values(anonymousLibrary.stories || {});
      if (
        anonymousStories.length > 0 &&
        Object.keys(accountLibrary.stories || {}).length === 0 &&
        confirm(`Import ${anonymousStories.length} story${anonymousStories.length === 1 ? "" : "ies"} saved on this device into ${u.email}?`)
      ) {
        accountLibrary.stories = {
          ...accountLibrary.stories,
          ...Object.fromEntries(anonymousStories.map((st) => [st.id, st])),
        };
      }
      library = accountLibrary;
    } else {
      library = loadLibrary(ANON_LIB_KEY);
    }
    saveLibrary();
  } else {
    user = u;
  }
  $("account-email").textContent = u ? u.email : "";
  $("account-email").classList.toggle("hidden", !u);
  $("account-btn").textContent = u ? "Account" : "Sign in";
  if (u && changed) syncWithCloud();
  renderLibrary();

  // Show the "Buy stories" button once signed in on a payments-enabled site.
  const buyBtn = $("buy-btn");
  if (buyBtn) {
    buyBtn.textContent = appConfig.payments?.testMode ? "Test Wick packs" : "Add Wicks";
    buyBtn.classList.toggle("hidden", !(u && appConfig.payments));
  }
  if (!u) {
    currentUserAdmin = false;
    $("admin-btn").classList.add("hidden");
  }

  // Credits follow the signed-in user.
  if (u) {
    refreshCredits().then(async () => {
      // A reader who signed in from the teaser wall already has a story open and
      // a chapter read. Claim it rather than starting over — losing the chapter
      // they just read to a fresh generation would waste the moment entirely.
      if (story && story.teaserPending) {
        pendingStart = false;
        if (await adoptTeaser()) resumeAfterAuth();
        return;
      }
      // If they clicked "Begin" before signing in, pick up where they left off.
      if (pendingStart) {
        pendingStart = false;
        startStory();
      }
    });
  } else {
    setCredits(null);
    pendingStart = false;
  }
}

// ----- credits display -----
function setCredits(n, account = creditAccount) {
  credits = n;
  creditAccount = account && typeof account === "object" ? account : creditAccount;
  const pill = $("credits-pill");
  if (!pill) return;
  if (n === null || (!appConfig.creditsEnforced && !appConfig.payments?.testMode)) {
    pill.classList.add("hidden");
    return;
  }
  pill.classList.remove("hidden");
  if (n === "unlimited") {
    pill.innerHTML =
      '<span class="balance-number">∞</span>' +
      '<span class="balance-copy"><strong>Wicks</strong><small>staff access</small></span>';
    pill.setAttribute("aria-label", "Unlimited Wicks. Open story packs.");
    pill.classList.remove("empty");
    return;
  }
  const word = n === 1 ? "Wick left" : "Wicks left";
  const note = creditAccount && creditAccount.firstNovellaIncluded
    ? "first one included"
    : creditAccount && creditAccount.ledgerStatus === "verified"
      ? "balance verified"
      : "tap to add more";
  pill.innerHTML =
    `<span class="balance-number">${n}</span>` +
    `<span class="balance-copy"><strong>${word}</strong><small>${note}</small></span>`;
  pill.setAttribute("aria-label", `${n} ${word}. Open Wick packs.`);
  pill.classList.toggle("empty", n <= 0);
}

async function refreshCredits() {
  if ((!appConfig.creditsEnforced && !appConfig.payments?.testMode) || !user) {
    setCredits(null);
    return;
  }
  try {
    const res = await fetch("/api/credits", { headers: await authHeader() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.ledgerStatus === "mismatch") toast(body.error);
      return;
    }
    const body = await res.json();
    currentUserAdmin = !!body.admin;
    $("admin-btn").classList.toggle("hidden", !currentUserAdmin);
    setCredits(body.credits, body);
  } catch { /* leave as-is */ }
}

function dashboardMoney(cents, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

function dashboardCost(micros, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format((Number(micros) || 0) / 1_000_000);
}

function openAdminDashboard() {
  if (!currentUserAdmin) return;
  showScreen("admin");
  loadAdminDashboard();
}

async function loadAdminDashboard() {
  if (!currentUserAdmin) return;
  const status = $("admin-status");
  status.textContent = "Opening the ledger…";
  status.classList.add("gentle");
  status.classList.remove("hidden");
  try {
    const res = await fetch(`/api/admin/monetization?days=${adminDays}`, {
      headers: await authHeader(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "dashboard unavailable");
    renderAdminDashboard(data);
    status.classList.add("hidden");
  } catch (error) {
    status.textContent = error.message || "The publisher’s ledger could not be opened.";
    status.classList.remove("gentle");
  }
}

function renderAdminDashboard(data) {
  const overview = data.overview || {};
  const funnel = data.funnel || {};
  const currency = data.currency || "usd";
  const started = funnel.story_started ? funnel.story_started.readers : 0;
  const completed = funnel.story_completed ? funnel.story_completed.readers : 0;
  const feesReady = overview.financialsComplete !== false;
  const kpis = [
    ["Gross sales", dashboardMoney(overview.grossRevenueCents ?? overview.revenueCents, currency), `${overview.purchases || 0} paid checkouts`],
    ["Refunds", dashboardMoney(overview.refundsCents, currency), `${overview.refunds || 0} completed refunds`],
    ["Stripe fees", feesReady ? dashboardMoney(overview.stripeFeesCents, currency) : "Pending", feesReady ? "captured from balance transactions" : "replay pending financial metadata"],
    ["Net receipts", dashboardMoney(overview.netRevenueCents, currency), "gross sales less refunds"],
    ["Model cost", data.costRatesConfigured ? dashboardCost(overview.estimatedCostMicros, currency) : "Not set", data.costRatesConfigured ? "token estimate" : "configure model rates"],
    ["Contribution after fees", data.costRatesConfigured && feesReady ? dashboardCost(overview.contributionAfterFeesMicros, currency) : "Pending", data.costRatesConfigured ? "net receipts less fees and model cost" : "configure model rates"],
    ["Reader accounts", String(overview.accounts || 0), `${overview.storySessions || 0} stories opened`],
    ["Outstanding Wicks", String(overview.outstandingCredits || 0), "future generation obligation"],
    ["Finished readers", String(completed), started ? `${Math.round(completed / started * 100)}% of starters` : "no starts yet"],
  ];
  $("admin-overview").innerHTML = kpis.map(([label, value, note]) =>
    `<article class="ledger-kpi"><span>${escapeHtml(label)}</span>` +
    `<strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`
  ).join("");

  const eventLabels = {
    world_selected: "Selected a world",
    setup_completed: "Completed character setup",
    story_started: "Opened the first chapter",
    story_completed: "Finished a Wick",
    checkout_opened: "Opened checkout",
    purchase_completed: "Completed a purchase",
  };
  const maxReaders = Math.max(
    1,
    ...Object.values(funnel).map((entry) => Number(entry.readers) || 0),
  );
  $("admin-funnel").innerHTML = Object.entries(eventLabels).map(([event, label]) => {
    const readers = funnel[event] ? Number(funnel[event].readers) || 0 : 0;
    const width = Math.max(readers ? 2 : 0, Math.round(readers / maxReaders * 100));
    return `<div class="funnel-row"><span class="funnel-label">${escapeHtml(label)}</span>` +
      `<span class="funnel-track"><span class="funnel-fill" style="--funnel-width:${width}%"></span></span>` +
      `<span class="funnel-value">${readers}</span></div>`;
  }).join("");

  const pilotRows = (data.pilots || []).map((pilot) => {
    const pilotFunnel = pilot.funnel || {};
    const selected = Number(pilotFunnel.world_selected) || 0;
    const started = Number(pilotFunnel.story_started) || 0;
    const finished = Number(pilotFunnel.story_completed) || 0;
    const feedback = pilot.feedback || {};
    const rating = feedback.averageRating == null ? "no ratings" : `${Number(feedback.averageRating).toFixed(1)}/5`;
    const paySignal = feedback.wouldPayAnswers
      ? `${feedback.wouldPay}/${feedback.wouldPayAnswers} would pay`
      : "no price answers";
    return `<div class="ledger-row"><strong>${escapeHtml(pilot.cohort)}</strong>` +
      `<span>${pilot.readers || 0} readers · ${selected} selected · ${started} started · ${finished} finished · ${feedback.responses || 0} notes · ${rating} · ${paySignal}</span></div>`;
  }).join("");
  $("admin-pilots").innerHTML = pilotRows || '<p class="ledger-empty">No tagged pilot readers in this period.</p>';

  const worldRows = (data.worlds || []).map((world) => {
    const known = SCENARIOS.find((candidate) => candidate.id === world.worldId);
    const name = known ? known.genre : world.worldId === "custom" ? "Write your own" : world.worldId;
    return `<div class="ledger-row"><strong>${escapeHtml(name)}</strong>` +
      `<span>${world.selected} chosen · ${world.completed} finished</span></div>`;
  }).join("");
  $("admin-worlds").innerHTML = worldRows || '<p class="ledger-empty">No world choices in this period.</p>';

  const creditLabels = {
    welcome_novella: "Welcome Wicks granted",
    stripe_purchase: "Paid Wicks granted",
    story_start: "Wicks begun",
    story_refund: "Failed starts refunded",
    admin_adjustment: "Staff adjustments",
  };
  const creditRows = Object.entries(creditLabels).map(([reason, label]) => {
    const row = data.credits && data.credits[reason];
    const creditsMoved = row ? Math.abs(Number(row.credits) || 0) : 0;
    return `<div class="ledger-row"><strong>${escapeHtml(label)}</strong>` +
      `<span>${creditsMoved}</span></div>`;
  }).join("");
  $("admin-credit-activity").innerHTML = creditRows;

  const reconciliation = data.reconciliation || {};
  const reconciliationEl = $("admin-reconciliation");
  reconciliationEl.className = `ledger-reconciliation ${reconciliation.status || "mismatch"}`;
  reconciliationEl.textContent = reconciliation.status === "verified"
    ? `Verified: all ${reconciliation.profiles || 0} reader balances agree with the immutable ledger.`
    : `Action required: ${reconciliation.mismatches || 0} reader balances do not agree with the ledger.`;
}

async function authHeader() {
  if (!sb) return {};
  try {
    const { data } = await sb.auth.getSession();
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  } catch {
    return {};
  }
}

// Two-way merge. Server timestamps are authoritative after first sync; a local
// dirty flag preserves offline edits without trusting the device clock.
async function syncWithCloud() {
  if (!sb || !user) return;
  try {
    const { data: rows, error } = await sb.from("stories").select("id, data, updated_at");
    if (error) throw error;
    const cloud = new Map(rows.map((r) => [r.id, r]));

    for (const [id, row] of cloud) {
      const cloudStory = row.data;
      const local = library.stories[id];
      const cloudUpdatedAt = Date.parse(row.updated_at) || 0;
      if (!local) {
        library.stories[id] = { ...cloudStory, cloudUpdatedAt, dirty: false };
      } else if (local.dirty) {
        await cloudSaveStory(local);
      } else if (
        cloudUpdatedAt > (local.cloudUpdatedAt || 0) ||
        (!local.cloudUpdatedAt && (cloudStory.updatedAt || 0) > (local.updatedAt || 0))
      ) {
        library.stories[id] = { ...cloudStory, cloudUpdatedAt, dirty: false };
      }
    }
    for (const st of Object.values(library.stories)) {
      if (!cloud.has(st.id)) {
        await cloudSaveStory(st);
      }
    }
    saveLibrary();
    renderLibrary();
  } catch (err) {
    console.warn("cloud sync failed:", err);
  }
}

function persistStory(st) {
  st.localRevision = (st.localRevision || 0) + 1;
  st.dirty = true;
  saveLibrary();
  cloudSaveStory(st);
}

function cloudSaveStory(st) {
  if (!sb || !user || !st) return Promise.resolve();
  const previous = cloudSaveChains.get(st.id) || Promise.resolve();
  const next = previous.catch(() => {}).then(() => performCloudSave(st));
  cloudSaveChains.set(st.id, next);
  next.finally(() => {
    if (cloudSaveChains.get(st.id) === next) cloudSaveChains.delete(st.id);
  });
  return next;
}

async function performCloudSave(st) {
  const revision = st.localRevision || 0;
  try {
    const { data, error } = await sb.from("stories").upsert({
      id: st.id,
      user_id: user.id,
      data: st,
      title: st.title || st.scenario.title,
      done: !!st.done,
      updated_at: new Date().toISOString(),
    }).select("updated_at").single();
    if (error) console.warn("cloud save failed:", error.message);
    else if (data) {
      st.cloudUpdatedAt = Date.parse(data.updated_at) || Date.now();
      if ((st.localRevision || 0) === revision) st.dirty = false;
      saveLibrary();
    }
  } catch (err) {
    console.warn("cloud save failed:", err);
  }
}

async function cloudDeleteStory(id) {
  if (!sb || !user) return;
  try {
    const pendingSave = cloudSaveChains.get(id);
    if (pendingSave) await pendingSave.catch(() => {});
    await sb.from("stories").delete().eq("id", id);
  } catch (err) {
    console.warn("cloud delete failed:", err);
  }
}

// ----- payments (buy story credits via Stripe) -----

function wirePayments() {
  const buy = $("buy-btn");
  if (buy) buy.addEventListener("click", openBuyModal);
  const pill = $("credits-pill");
  if (pill) pill.addEventListener("click", openBuyModal);
  const close = $("buy-close");
  if (close) close.addEventListener("click", closeBuyModal);
  const modal = $("buy-modal");
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeBuyModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBuyModal(); });
}

function wirePilotFeedback() {
  const cohort = pilotCohort();
  const button = $("pilot-feedback-btn");
  if (!button) return;
  button.classList.toggle("hidden", !cohort);
  if (cohort) $("account-bar").classList.remove("hidden");
  button.addEventListener("click", () => {
    if (!cohort) return;
    const completion = $("pilot-completion");
    completion.value = story && story.done
      ? "finished"
      : story && story.chapters && story.chapters.length > 1
        ? "in_progress"
        : "first_chapter";
    $("pilot-feedback-message").classList.add("hidden");
    $("pilot-feedback-modal").classList.remove("hidden");
  });
  $("pilot-feedback-close").addEventListener("click", closePilotFeedback);
  $("pilot-feedback-modal").addEventListener("click", (event) => {
    if (event.target === $("pilot-feedback-modal")) closePilotFeedback();
  });
  $("pilot-feedback-submit").addEventListener("click", submitPilotFeedback);
}

function closePilotFeedback() {
  $("pilot-feedback-modal")?.classList.add("hidden");
}

async function submitPilotFeedback() {
  const cohort = pilotCohort();
  const feedback = $("pilot-feedback-text").value.trim();
  const message = $("pilot-feedback-message");
  if (!cohort || !feedback) {
    message.textContent = "Please add a short candid note.";
    message.classList.remove("hidden", "gentle");
    return;
  }
  const button = $("pilot-feedback-submit");
  button.disabled = true;
  message.textContent = "Sending…";
  message.classList.add("gentle");
  message.classList.remove("hidden");
  const payAnswer = $("pilot-would-pay").value;
  try {
    const response = await fetch("/api/pilot/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        cohort,
        sessionId: productSessionId(),
        storyId: story && story.id || null,
        completionState: $("pilot-completion").value,
        rating: Number($("pilot-rating").value),
        wouldPay: payAnswer === "" ? null : payAnswer === "yes",
        feedback,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "feedback failed");
    $("pilot-feedback-text").value = "";
    closePilotFeedback();
    toast("Thank you — your pilot note was saved.");
  } catch (error) {
    message.textContent = error.message || "Couldn't save that feedback.";
    message.classList.remove("gentle");
  } finally {
    button.disabled = false;
  }
}

function openBuyModal() {
  const modal = $("buy-modal");
  if (!modal) return;
  if (!appConfig.payments) {
    // Payments not configured on this server — nothing to sell.
    alert("Wick packs aren't set up on this site yet.");
    return;
  }
  if (!user) { pendingStart = false; openAuthModal(); return; }
  const testMode = !!appConfig.payments.testMode;
  $("buy-title").textContent = testMode ? "Test Wick packs" : "Wick packs";
  $("buy-mode-note").classList.toggle("hidden", !testMode);
  $("buy-fineprint").textContent = testMode
    ? "Stripe sandbox checkout. Test cards only; no real charge will be made."
    : "Secure checkout by Stripe. Your Wicks never expire.";
  renderPacks();
  $("buy-message").classList.add("hidden");
  modal.classList.remove("hidden");
}

function closeBuyModal() {
  const modal = $("buy-modal");
  if (modal) modal.classList.add("hidden");
}

function renderPacks() {
  const grid = $("pack-grid");
  if (!grid || !appConfig.payments) return;
  const cur = appConfig.payments.currency || "usd";
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: cur });
  grid.innerHTML = "";
  for (const [id, pack] of Object.entries(appConfig.payments.packs)) {
    const each = pack.price / pack.credits / 100;
    const btn = document.createElement("button");
    btn.className = "pack";
    btn.innerHTML =
      `<span class="pack-count">${pack.credits}</span>` +
      `<span class="pack-label">${escapeHtml(pack.label)}</span>` +
      `<span class="pack-price">${fmt.format(pack.price / 100)}</span>` +
      `<span class="pack-each">${fmt.format(each)} each</span>`;
    btn.addEventListener("click", () => buyPack(id, btn));
    grid.appendChild(btn);
  }
}

async function buyPack(packId, btn) {
  if (btn) btn.disabled = true;
  buyMessage("Opening secure checkout…", true);
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ pack: packId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) throw new Error(body.error || "checkout failed");
    window.location.href = body.url; // Stripe-hosted checkout page
  } catch (err) {
    console.error(err);
    buyMessage("Couldn't start checkout. Please try again.");
    if (btn) btn.disabled = false;
  }
}

function buyMessage(text, gentle) {
  const el = $("buy-message");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("gentle", !!gentle);
  el.classList.remove("hidden");
}

// After returning from Stripe, credits are granted by the webhook (server-side,
// possibly a beat later). Refetch the balance a couple of times to catch up.
function handleCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const status = params.get("checkout");
  if (!status) return;
  // Clean the URL so a refresh doesn't re-trigger this.
  history.replaceState({}, "", location.pathname);
  if (status === "success") {
    toast(appConfig.payments?.testMode
      ? "Sandbox payment received — your test Wicks are being added."
      : "Payment received — your Wicks are being added.");
    let tries = 0;
    const poll = setInterval(async () => {
      await refreshCredits();
      if (++tries >= 5) clearInterval(poll);
    }, 1500);
  } else if (status === "cancel") {
    toast("Checkout canceled — no charge was made.");
  }
}

function toast(text) {
  let el = $("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 4000);
}
