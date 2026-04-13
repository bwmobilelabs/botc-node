
export const seed = async (knex) => {
  // Deletes ALL existing entries
  await knex('characters').where('type', 'minion').del();

  // Inserts seed entries
  await knex('characters').insert([
    {
      name: 'Assassin',
      type: 'minion',
      ability: 'Once per game, at night*, choose a player: they die, even if for some reason they could not.',
      flavor_text: '...'
    },
    {
      name: 'Baron',
      type: 'minion',
      ability: 'There are extra Outsiders in play. [+2 Outsiders]',
      flavor_text: 'This town has gone to the dogs, what? Cheap foreign labor... that\'s the ticket. Stuff them in the mine, I say. A bit of hard work never hurt anyone, and a clip\'o\'the ears to any brigand who says otherwise. It\'s all about the bottom line, what?'
    },
    {
      name: 'Boffin',
      type: 'minion',
      ability: 'The Demon (even if drunk or poisoned) has a not-in-play good character\'s ability. You both know which.',
      flavor_text: 'Stellar hydrogen, vast, inert; carbon, oxygen, neon gases, all ruined. Molecular chaos, entropy, yields new cosmic phenomena, rebirth from atomic chaos, dense matter collapsing. All in a teeny little bottle.'
    },
    {
      name: 'Boomdandy',
      type: 'minion',
      ability: 'If you are executed, all but 3 players die. After a 10 to 1 countdown, the player with the most players pointing at them, dies',
      flavor_text: 'Tick... Tick... Tick... TOCK.'
    },
    {
      name: 'Cerenovus',
      type: 'minion',
      ability: 'Each night, choose a player & a good character: they are "mad" they are this character tomorrow, or might be executed.',
      flavor_text: 'Reality is merely an opinion. Specifically, my opinion.'
    },
    {
      name: 'Devil\'s Advocate',
      type: 'minion',
      ability: 'Each night, choose a living player (different to last night): if executed tomorrow, they don\'t die.',
      flavor_text: 'My client, should the objection be overruled, pleads innocent by virtue of the prosecution\'s non-observance of statute 27.B - incorrect or misleading conjugation of a verb. The fact that nine of the jury died last night is simply prima facie, which is, as Wills vs Thule set precedent for, further reason to acquit.'
    },
    {
      name: 'Evil Twin',
      type: 'minion',
      ability: 'You & an opposing player know each other. If the good player is executed, evil wins. Good can\'t win if you both live.',
      flavor_text: 'I\'m not Sara! I\'m Clara! SHE is Sara! Sara is the evil one! Not me!'
    },
    {
      name: 'Fearmonger',
      type: 'minion',
      ability: 'Each night, choose a player: if you nominate & execute them, their team loses. All players know if you choose a new player.',
      flavor_text: 'Beware of gazing long into the Abyss, lest the Abyss also gaze into you.'
    },
    {
      name: 'Goblin',
      type: 'minion',
      ability: 'If you publicly claim to be the Goblin when nominated & are executed that day, your team wins.',
      flavor_text: 'You don\'t want to insult the goblins. You really, really don\'t. On a completely different note… can I have another piece of cake?'
    },
    {
      name: 'Godfather',
      type: 'minion',
      ability: 'You start knowing which Outsiders are in play. If 1 died today, choose a player tonight: they die. [-1 or +1 Outsider]',
      flavor_text: 'Normally, it\'s just business. But when you insult my daughter, you insult me. And when you insult me, you insult my family. You really should be more careful - it would be a shame if you had an unfortunate accident.'
    },
    {
      name: 'Harpy',
      type: 'minion',
      ability: 'Each night, choose 2 players: tomorrow, the 1st player is mad that the 2nd is evil, or one or both might die.',
      flavor_text: 'So fair a day I never did see, nor so fowl a presence hanging over me.'
    },
    {
      name: 'Marionette',
      type: 'minion',
      ability: 'You think you are a good character, but you are not. The Demon knows who you are. [You neighbor the Demon]',
      flavor_text: 'Words, words. They\'re all we have to go on.'
    },
    {
      name: 'Mastermind',
      type: 'minion',
      ability: 'If the Demon dies by execution (ending the game), play for 1 more day. If a player is then executed, their team loses.',
      flavor_text: 'The tentacles of that monster are nailed to the doors of the church. Mothers and children are dancing in the street. Excellent. Everything is proceeding exactly as I have planned.'
    },
    {
      name: 'Mezepheles',
      type: 'minion',
      ability: 'You start knowing a secret word. The 1st good player to say this word becomes evil that night.',
      flavor_text: 'That which issues from the heart alone, will bend the hearts of others to your own.'
    },
    {
      name: 'Organ Grinder',
      type: 'minion',
      ability: 'All players keep their eyes closed when voting and the vote tally is secret. Each night, choose if you are drunk until dusk.',
      flavor_text: 'Round and round the handles go. The more you dance the less you know.'
    },
    {
      name: 'Pit-Hag',
      type: 'minion',
      ability: 'Each night*, choose a player & a character they become (if not in play). If a Demon is made, deaths tonight are arbitrary.',
      flavor_text: 'Round about the cauldron go; In the poison\'d entrails throw; Toad, that under cold stone; Days and nights has thirty-one; Sweated venom sleeping got; Boil thou first in the charmed pot.'
    },
    {
      name: 'Poisoner',
      type: 'minion',
      ability: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
      flavor_text: 'Add compound Alpha to compound Beta... NOT TOO MUCH!'
    },
    {
      name: 'Psychopath',
      type: 'minion',
      ability: 'Each day, before nominations, you may publicly choose a player: they die. If executed, you only die if you lose roshambo.',
      flavor_text: 'Surprise!'
    },
    {
      name: 'Scarlet Woman',
      type: 'minion',
      ability: 'If there are 5 or more players alive & the Demon dies, you become the Demon. (Travellers don\'t count.)',
      flavor_text: 'You have shown me the secrets of the Council of the Purple Flame. We have lain together in fire and in lust and in beastly commune, and I am forever your servant. But tonight, my dear, I am your master.'
    },
    {
      name: 'Spy',
      type: 'minion',
      ability: 'Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.',
      flavor_text: 'Any brewmaster worth their liquor, knows no concoction pours trouble quicker, than one where spies seem double.'
    },
    {
      name: 'Summoner',
      type: 'minion',
      ability: 'You get 3 bluffs. On the 3rd night, choose a player: they become an evil Demon of your choice. [No Demon]',
      flavor_text: 'Hail the guardians of the north; by my intellect, thou art cut. Hail the guardians of the east; by my will, thou art dominated. Hail the guardians of the south; by that which lies beyond, the mystery is revealed. Hail the guardians of the west; a shield in the darkness'
    },
    {
      name: 'Vizier',
      type: 'minion',
      ability: 'All players know you are the Vizier. You cannot die during the day. If good voted, you may choose to execute immediately.',
      flavor_text: 'An excellent decision, as always, sire. Such a petty crime as bumping into the Bishop indeed deserves your \'justice\' and \'mercy\'. Take a stroll in the gardens. Visit the gallery and peruse the sculptures of Von Strauf. Relax, sire. Leave everything… to me.'
    },
    {
      name: 'Widow',
      type: 'minion',
      ability: 'On your 1st night, look at the Grimoire & choose a player: they are poisoned. 1 good player knows a Widow is in play.',
      flavor_text: 'More wine? Château d\'Ergot \'07 is a very special vintage. My yes, very special indeed.'
    },
    {
      name: 'Witch',
      type: 'minion',
      ability: 'Each night, choose a player: if they nominate tomorrow, they die. If just 3 players live, you lose this ability.',
      flavor_text: 'Three drops of goat\'s blood. A lock of hair, torn in anger. The name is spoken, the shadow cast. Walk left foot first down that brambled path, and don\'t look back'
    },
    {
      name: 'Wizard',
      type: 'minion',
      ability: 'Once per game, choose to make a wish. If granted, it might have a price & leave a clue as to its nature.',
      flavor_text: 'Every man and every woman is a star. Love is the law, love under will.'
    },
    {
      name: 'Wraith',
      type: 'minion',
      ability: 'You may choose to open your eyes at night. You wake when other evil players do.',
      flavor_text: 'Ra\'āb ina pān ṣilli ša dāri. Rigim qallu ina šūri, šītu ša šunātīka iredde, u napšutka idlul ina pān maṣṣartī dāriti.'
    },
    {
      name: 'Xaan',
      type: 'minion',
      ability: 'On night X, all Townsfolk are poisoned until dusk. [X Outsiders]',
      flavor_text: 'Down they fall. One by one. By two, by three, by five.'
    }
  ]);
};
