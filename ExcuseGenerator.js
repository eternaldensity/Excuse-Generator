/*
 * (Not Really Armsmaster's) Random Excuse Generator
 * Generates excuses. Which are random.
 *
 * Coded by EldritchPangolin (who's unfortunately not Armsmaster)
 *
 */

"use strict";

function factoryFun(prototype, constructor) {
    return function() {
        var instance = Object.create(prototype);
        constructor.apply(instance, arguments);
        return instance;
    }
}

// generator namespace
var G = function() {
    var G = {};

    var quotePrototype = {}
    quotePrototype.generate = function() {
        return this.str;
    }
    G.Quote = factoryFun(quotePrototype, function(str) {
        this.str = str;
    })

    // wrappers

    var postprocessPrototype = {};
    postprocessPrototype.generate = function() {
        return this.fun(this.wrapped.generate());
    }
    G.Postprocess = factoryFun(postprocessPrototype, function(wrapped, fun) {
        this.wrapped = readGen(wrapped);
        this.fun = fun;
    })

    var rollUntilPrototype = {};
    rollUntilPrototype.generate = function() {
        var result;
        while (!this.fun(result = this.wrapped.generate())) { }
        return result;
    }
    G.RollUntil = factoryFun(rollUntilPrototype, function(wrapped, fun) {
        this.wrapped = readGen(wrapped);
        this.fun = fun;
    })

    var repPrototype = {};
    repPrototype.generate = function() {
        var range = this.max - this.min + 1;
        var repeats = this.min + Math.floor(Math.random() * range);
        var result = [];
        for (var i = 0; i < repeats; i++) {
            result.push(this.wrapped.generate());
        }
        return result.join(' ');
    }
    G.Rep = factoryFun(repPrototype, function(wrapped, min, max) {
        this.wrapped = readGen(wrapped);
        this.min = min;
        this.max = max;
    })

    G.Opt = function(wrapped) { return G.Rep(wrapped, 0, 1); }

    // for escaping splicing in nested alternates
    G.Id = function(wrapped) { return G.Rep(wrapped, 1, 1); }

    // combinators

    var seqPrototype = {}
    seqPrototype.generate = function() {
        return this.seq.map(function (g) { return g.generate(); }).join(" ");
    }
    seqPrototype.and = function(gen) {
        this.seq.push(readGen(gen));
    }
    G.Seq = factoryFun(seqPrototype, function(seq) {
        this.seq = seq.map(readGen);
    })

    var altPrototype = {};
    altPrototype.or = function(alt, prob) {
        if (typeof prob == 'number') {
            this.nonUniform = true;
        }
        alt = readGen(alt);
        if (altPrototype.isPrototypeOf(alt)) { // splice
            Array.prototype.push.apply(this.alts, alt.alts);
            Array.prototype.push.apply(this.probs, alt.probs);
        } else {
            this.alts.push(alt);
            this.probs.push(prob);
        }
    }
    altPrototype.normalizeDist = function() {
        var undefs = [], defs = [];
        var i;
        var totalDefined = 0;
        for (i = 0; i < this.probs.length; ++i) {
            if (typeof this.probs[i] == 'number') {
                totalDefined += this.probs[i];
                defs.push(i);
            } else {
                undefs.push(i);
            }
        }
        if (totalDefined > 1.0) {
            for (i = 0; i < defs.length; ++i) {
                this.probs[defs[i]] /= totalDefined;
            }
            for (i = 0; i < undefs.length; ++i) {
                this.probs[undefs[i]] = 0;
            }
        } else {
            var defaultProb = (1.0 - totalDefined) / undefs.length;
            for (i = 0; i < undefs.length; ++i) {
                this.probs[undefs[i]] = defaultProb;
            }
        }
        this.normalizedDist = true;
    }
    altPrototype.generate = function() {
        var chosen, roll, partialSum;
        if (this.nonUniform) {
            if (!this.normalizedDist) {
                this.normalizeDist();
            }
            roll = Math.random();
            chosen = 0;
            partialSum = this.probs[0];
            for (chosen = 0, partialSum = this.probs[0];
                 partialSum < roll && chosen < this.alts.length - 1;
                 partialSum += this.probs[++chosen]) { }
        } else {
            chosen = Math.floor(Math.random() * this.alts.length);
        }
        return this.alts[chosen].generate();
    }
    G.Alt = factoryFun(altPrototype, function(alts) {
        this.alts = [];
        this.nonUniform = false;
        this.normalizedDist = false;
        this.probs = [];
        if (!alts) {
            alts = [];
        }
        for (var i = 0; i < alts.length; ++i) {
            this.or(alts[i]);
        }
    })

    function readGen(gen) {
        if (typeof gen == 'string') {
            return G.Quote(gen);
        } else if (Array.isArray(gen)) {
            return G.Seq(gen);
        } else {
            return gen;
        } 
    }

    return G;
}()

var excuseGenerator = function() {
    var g;
    
    var contessa = "a mysterious unnaturally competent woman in a suit";
                      
    var Hero = G.Alt([
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=halberd}Armsmaster", 
	"{!OWNER_POSSESSIVE=her}{!OWNER_OBJECT=library}Alexandria",
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=fish tank}Eidolon", 
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=son}Legend",
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=cannonblade}Chevalier", 
	"{!OWNER_POSSESSIVE=her}{!OWNER_OBJECT=bazooka}Miss Militia", 
	"{!OWNER_POSSESSIVE=her}{!OWNER_OBJECT=ham and cheese}Mouse Protector", 
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=wand}Myrddin", 
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=bacon}Chubster", 
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=arc lance}Dauntless", /* FINE he can be included too, it's not worth a weeks' pay */ 
	"{!OWNER_POSSESSIVE=her}{!OWNER_OBJECT=bust}Narwhal", 
	"{!OWNER_POSSESSIVE=her}{!OWNER_OBJECT=tiara}Glory Girl", 
	"{!OWNER_POSSESSIVE=her}{!OWNER_OBJECT=charger}Battery", 
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=pepper}Assault", 
	"{!OWNER_POSSESSIVE=his}{!OWNER_OBJECT=coffee mug}Velocity", 
	"{!OWNER_POSSESSIVE=her}{!OWNER_OBJECT=top secret suit}Dragon"]);
    var Endbringer = G.Alt(["Simurgh", "Ziz", "Leviathan", "Behemoth",
            "Hadhayosh"]);
    var Professionals = G.Alt(["accountants", "auto mechanics", "clowns",
            "pro wrestlers", "divorce lawyers", "barbers", "nightclub bouncers",
            "mimes", "scuba divers", "quantum mechanics", "bank executives",
            "janitors", "government agents", "mailmen", "burger flippers"]);
    var Gang = G.Alt(["the Empire 88",
                      "the Azn Bad Boys",
                      "the Merchants",
                      contessa,
                      "the Slaughterhouse 9",
                      "some meddling teenagers in a van",
                      "the local chapter of the Hell's Angels",
                      "the Girl Scouts' cookie-selling brigade",
			"the League of Door to Door Salesmen", "the Dragonslayers", "The Teeth",
			"an angry swarm of BEES", "THE TECHNO QUEEN'S DASTARDLY TECHIES"]);

    var Master = G.Alt(['Regent','Pretender','Heartbreaker','Canary']);
    var LocationsRaw = G.Alt([
	    "in@into@ the nearby park",
	    "at@to@   the beach",
	    "at@to@   Fugly Bob's",
	    "in@into@ EndVaultTech's board meeting room",
	    "at@to@   the local retirement home",
	    "in@into@ my neighborhood",
	    "in@into@ my mailbox",
	    "in@into@ my chimney",
	    "on@onto@ my roof",
	    "in@into@ the rusted hulk of a ship",
	    "in@into@ the post office",
	    "inside@into@ Arcadia High",
	    "in@into@ the Winslow High girls' locker room",
	    "in@into@ the local swimming pool",
	    "in@into@ a seedy hotel room",
	    ]);
    function mapLocationsAt(s) {
	    return s.replace(/^(\w*)@(\w*)@\s*(.*)/,'$1 $3')
    }
    function mapLocationsTo(s) {
	    return s.replace(/^(\w*)@(\w*)@\s*(.*)/,'$2 $3')
    }
    function mapLocationsNone(s) {
	    return s.replace(/^(\w*)@(\w*)@\s*(.*)/,'$3')
    }
    function makeHeroPossessive(s) {
	    return s.replace(/^(.*)}(.*)$/,"$2's")
    }
    function mapHeroesNone(s) {
	    return s.replace(/^(.*)}(.*)$/,"$2")
    }
    var LocationTo = G.Postprocess(LocationsRaw, mapLocationsTo);
    var LocationAt = G.Postprocess(LocationsRaw, mapLocationsAt);
    var LocationNone = G.Postprocess(LocationsRaw, mapLocationsNone);
    var HeroPossessive = G.Postprocess(Hero, makeHeroPossessive);    
	var HeroOnly=G.Postprocess(Hero,mapHeroesNone);
	
    var Thingy = G.Alt(["wristwatch", "underwear", "necktie", "lunchbox",
            "wallet", "cellphone", "baseball cap", "monocle", "waffle",
            "buzzsaw", "saucepan", "HDMI cable", "sock", "toaster oven",
	"muffin", "t-shirt", "belt and suspenders", "vase", "sippy cup", "beer coaster",
	"vegetable peeler", "fruit juicer", "blender", "fedora"]);
	Thingy.or([HeroOnly, G.Alt(["doll", "action figure", "plushie"])]);
    var WeirdThingyTrait = G.Alt(["radioactive", "thermonuclear", "ballistic",
            "tactical", "AI-controlled", "antimatter", "monomolecular", "futuristic", "alternate", "metallic", "non-stick", "autotuned", "shrinking", "uncontrollable", "self-steering", "vibrating",
"anti-rust", "self-lubricating", "fractal-based"]);
    var WackyActivityProgressive = G.Alt(["mauling random passers-by",
            ["setting up a muffin stall", LocationAt],
            ["spraypainting suggestive graffiti", LocationAt],
            ["writing sappy love notes to", Hero],
            ["auditioning for a movie role as", Hero],
            ["setting up an online dating profile for", Endbringer],
            "acting out the Who's on First sketch",
            "tracking mud all over the office",
            "howling majestically to the moon",
		"twerking", "conga dancing",
		["planking",LocationAt],
		["dressing up as", Endbringer]]);
		
    var Clothing = G.Alt(["a top-hat", "a PRT uniform", "a police uniform", "nothing but a smile", "a topless bikini", "strategically placed Christmas ornaments", "aviator sunglasses", "a black hoodie", "a red and white striped beanie", "a ten gallon hat and cowboy boots", "a three piece suit", "copious amounts of whipped cream", "a battleship", "a doge costume", "a spider costume"]);
    Clothing.or([HeroPossessive, "mask"]);   
    var SwingThing = G.Alt(['fish', 'backpack', 'cat', 'herring', 'Nerf-bat', 
    'clue-bat', 'squeaky toy mallet', 'inflatable pool toy', 
    'golf club', 'obviously fake foam sword', 'croquet mallet',
    'inflatable baseball bat', 'bottle', 'nailbat', 'brickbat', 'football bat',
    'folding chair', 'brick']);

    var Critter = G.Alt(["kitten", "squirrel", "puppy", "hedgehog", "pony", "unicorn", "bullet ant",
                         "antelope", "sugar ant", "black widow spider", "bear cub", "honey badger"]);
    var WeirdCritterTrait = G.Alt(["pink", "sapient", "flying", "tentacled", "angry",
            "insectoid", "gargantuan", "glittery", "long-toothed", "slimy", "skinny", "eldrich"]);
    var Substance = G.Alt(["ice cream", "candy", "cocaine", "psychic energy",
            "liquid nitrogen", "radioactive sludge", "jello", "clay","solidified air",
		"orphans' tears", "hot buttered popcorn", "coffee beans", "powdered water", 
		"bubbly champagne", "solid clouds", "aerogel", "terracotta", ["powdered", [Endbringer], "figurines"],
            ["liquefied", Critter, "flesh"]]);
    var ThirdParty = G.Alt([["my pet", Critter], "my son", "my daughter", "my evil twin", "your mom", "my red-headed stepchild", "my brother", "my sister", "my cousin"]);
    var PersonCrimePast = G.Alt(["pranked by", "chased by", "wolf-whistled by", "racially slurred by",
            "asked on a date by a member of", "tickled by", "glared at by",
	 "winked at by", "ignored by", "recruited by", ["teleported",LocationTo, "by"], "sent to the future by", "mindswapped with", "mistaken for a member of"]);
    var PropertyCrimePast = G.Alt(["stolen", "defaced", "ruined with spilled lemonade",
            "vandalised", "spray painted", "replaced with a mirror image", "sent to Earth Aleph", "hidden in the Boat Graveyard", ["fed to",ThirdParty], "chipped", "tarnished", "hidden in a school locker"]);
    var ValueModifier = G.Alt(["vintage", "antique", "priceless", "overpriced", "one-of-a-kind", "rare",
            "limited edition", "autographed", "heirloom", "foil", "unique", "authorized"]);
    var QualityModifier = G.Alt(["tinkertech", "handcrafted", "masterwork", "Armsmaster-approved", "Wards-tested",
            "customized", "dwarven", "restored", "recycled", "damaged"]);
    var Theme = G.Postprocess(HeroOnly, function (s) { return s + "-themed"; });
    
    var Num = G.Alt(["a dozen", "a baker's dozen", "thirty-four", "five", "over nine thousand", "forty", "fifteen million", "one mirrion", "pi", "the correct number of", "enough", "zero", "aleph-null"]);
    
    var Unit = G.Alt(["buckets", "teaspoons", "units", "packets", "baggies", "lunchboxes", "crates", "boxcars", "Pacific Oceans", "moon units", "upturned bowler hats", "pints", "liters", "litres", "gallons", "tons", "tonnes"]);
    
    var Time = G.Alt(["midnight", "Friday", "close of business", "the next full moon", "the end of the big match", "the time it takes me to count to ten", "the next Endbringer attack", "lunchtime", "teatime", "the end of school holidays", "my birthday", "Christmas", "the time the cows come home", "the day before the election"]);
    
    var Restraint = G.Alt(["chains", "a straight-jacket", "a blindfold", "whipped cream", "a bodybag"]);
    var RestraintManner = G.Alt(["carefully", "properly", "sensibly", "logically", "tenderly", "absolutely"]);

	var WorldEffect = G.Alt(["appropriate theme music", "inappropriate theme music", "everyone's most hated earworms", "the Inception BWONG at dramatic moments", "Kung Fu movie captions", "the Lost City of Atlantis", "disco lights", "the sound of drums"]);

    // These results can be salvaged instead of rerolling.
    function contessaFix(str) {
    	str = str.replace('a member of ' + contessa, contessa, 'g');
    	str = str.replace('superpowered members of ' + contessa, contessa, 'g');
    	str = str.replace('members of ' + contessa, contessa, 'g');
    	return str;
    }
    function maskFix(str){
        return str.replace("Dragon's mask", "Dragon's newest suit as a hat", 'g');
    }
    function fixTypelessPower(str)
    {
        return str.replace('{CLASS_PLACEHOLDER} type power','Power', 'g');
    }
    function fixIConsumes(str)
    {
        return str.replace('I consumes','I consume', 'g').replace('you consumes','you consume', 'g');
    }
    
    function removeArticleWhenUncountable(s) {
        if (/underwear/.test(s)) {
            s = s.replace(" an ", " ");
        }
        return s;
    }

    function noRedundantGargantuanness(s) {
        return !/gargantuan/.test(s);
    }

    function noGangInfighting(s) {
        var matches = s.match(/{B}([^{]*){AND}and(.*)/);
        return matches[1].trim() != matches[2].trim();
    }
    
    function parenthesize(s){
        return "("+s+")";
    }

    // ModdedThingy
    g = G.Seq([G.Opt(ValueModifier), G.Opt(QualityModifier),
               G.Opt(Theme), Thingy]);
    var ModdedThingy = G.Postprocess(g, function(s) {
        if (/doll|action figure|plushie/.test(s)) {
            // no redundantly themed merchandise
            s = s.replace(/([A-Z][^\s]+\s*)*themed\s*/, "");
        }
        return s;
    })

    // TriggeringEntity
    g = G.Alt(["I{!OWNER_POSSESSIVE=my}{!HAVE_PLACEHOLDER=have}{!OWNER_NOMINATIVE=I}",
               ["my pet{!OWNER_POSSESSIVE=its}{!HAVE_PLACEHOLDER=has}{!OWNER_NOMINATIVE=it}", 
                Critter],
               "my daughter{!HAVE_PLACEHOLDER=has}{!OWNER_POSSESSIVE=her}{!OWNER_NOMINATIVE=she}",
               "my son{!HAVE_PLACEHOLDER=has}{!OWNER_POSSESSIVE=his}{!OWNER_NOMINATIVE=he}"]); 
    var TriggeringEntity = g;

    var FunnyBodyPart = G.Alt(["ears", "toes", "eyes", "navel", "nostrils",
            "armpits", "kneecaps", "elbows", "ponytail", "back hair"]);

    // Power
    g = G.Alt();
    g.or("of acutely artful and aimless alliteration{!CLASS_PLACEHOLDER=thinker}");
    g.or(["{!CLASS_PLACEHOLDER=thinker}of", Critter, "migratory pattern",
          "prediction"]);
    g.or(["{!CLASS_PLACEHOLDER=blaster}of slaughtering firstborn",
            G.Alt(["sons", "daughters"])]);
    g.or(["{!CLASS_PLACEHOLDER=blaster}to shoot", Substance, "out of", 
            "{OWNER_POSSESSIVE}", FunnyBodyPart]);
    g.or(["{!CLASS_PLACEHOLDER=mover}of extreme", G.Alt(["flamenco", "disco",
                "tango", "samba"]), 
          "dancing"]);
    g.or(["{!CLASS_PLACEHOLDER=tinker}of", WeirdThingyTrait, Thingy,
            "construction"]);
    g.or(["{!CLASS_PLACEHOLDER=tinker}of", WeirdCritterTrait, Critter,
            "cloning"]);
    g.or(["{!CLASS_PLACEHOLDER=shaker}to conjure", WorldEffect]);

    g.or(G.Postprocess(["{!CLASS_PLACEHOLDER=master}to project an",
                            "indestructible animate",
                            WeirdThingyTrait, Thingy], 
                       removeArticleWhenUncountable));
    g.or(["{!CLASS_PLACEHOLDER=master}to create golems made of", Substance]);
    g.or(["{!CLASS_PLACEHOLDER=breaker}to turn into a living mass of",
            Substance]);
    g.or(["{!CLASS_PLACEHOLDER=changer}to grow", G.Alt(["tentacles", "teeth",
                "antennae", "eyestalks", "an epic beard", 
                [Substance, "spikes"]]), 
          "out of {OWNER_POSSESSIVE}", FunnyBodyPart]);
    g.or(G.RollUntil(["{!CLASS_PLACEHOLDER=changer}to turn into a giant",
                      WeirdCritterTrait, Critter], noRedundantGargantuanness));	
    g.or(["{!CLASS_PLACEHOLDER=stranger}to exactly impersonate",Hero,"whenever {OWNER_NOMINATIVE} consumes", Substance]);
    g.or(["{!CLASS_PLACEHOLDER=stranger}to become invisible to",
          G.Alt(["redheaded", "bald", "mohawk sporting", "mullet bearing"]),
          Professionals, "wearing", G.Alt(["yarmulkas", "top hats", 
                                           "flip-flops", "togas"])]);
    g.or(["of", G.Alt(["Greyskull", "Positive Thinking", "One", "Two", "Ten", "Rock", "Voodoo"])]);
    var Power = g;

    g = G.Alt(['{!OWNER_POSSESSIVE=her}{!OWNER_NOMINATIVE=she}','{!OWNER_POSSESSIVE=his}{!OWNER_NOMINATIVE=he}']);
    var SomeHero = G.Alt(
            [Hero, G.Postprocess(
                    [G.Postprocess(
                            [G.Alt(
                                    ['{!OWNER_POSSESSIVE=her}{!OWNER_NOMINATIVE=she}',
    	                            '{!OWNER_POSSESSIVE=his}{!OWNER_NOMINATIVE=he}']),
			                ['{!OWNER_OBJECT=',ModdedThingy,'}'],
    	                    "the new hero with the {CLASS_PLACEHOLDER} type power", Power],
                            tagCopyFun(
                                    'HAVE_PLACEHOLDER', 'CLASS_PLACEHOLDER',
                                    'OWNER_POSSESSIVE', 'OWNER_NOMINATIVE')
                            )
                    ],
                    fixTypelessPower
            )]
    );
    
    var YourPower = G.Postprocess(G.Postprocess(G.Postprocess([
        "You{!OWNER_POSSESSIVE=your}{!HAVE_PLACEHOLDER=have}{!OWNER_NOMINATIVE=you}", 
        "{HAVE_PLACEHOLDER} the {CLASS_PLACEHOLDER} type power", Power],
                       tagCopyFun('HAVE_PLACEHOLDER', 'CLASS_PLACEHOLDER',
                                  'OWNER_POSSESSIVE', 'OWNER_NOMINATIVE')),
        fixTypelessPower),fixIConsumes);

    var g = G.Alt();
    g.or([SomeHero,G.Alt([
        'is pregnant','has a drug problem','is faking {OWNER_POSSESSIVE} powers',
		'is an evil clone','bought {OWNER_POSSESSIVE} powers','was drunk and disorderly',
		'is working overtime far too often','is from the future','is the fourth Endbringer',
		'is retiring in two days','is my father', 'is your mom','is secretly the Space Pope',
		'suffers from the delusion that the world is fiction','is secretly Director Costa-Brown',
		['is being controlled by',Master],
		'never existed',
		'is a Time Lord and {OWNER_POSSESSIVE} {OWNER_OBJECT} is {OWNER_POSSESSIVE} TARDIS'])]);
    var SomeHeroProblem = G.Postprocess(g,tagCopyFun('OWNER_POSSESSIVE','OWNER_OBJECT','OWNER_POSSESSIVE'))

    // CitizenExcuse
    g = G.Alt();
    g.or(["hand over a", G.Rep(WeirdCritterTrait, 0, 2), "tinkertech", Critter,
          "that I found", WackyActivityProgressive]);
    g.or(["hand over a tinkertech", G.Rep(WeirdThingyTrait,0, 2), Thingy,
          "that I found", LocationAt]);
    g.or(G.RollUntil(["report a gang fight between{B}", Gang, "{AND}and", 
                      Gang], noGangInfighting)); 
    g.or(G.Postprocess(["report superpowered members of", Gang, 
                      "loitering", LocationAt], contessaFix));
    g.or(G.Postprocess(G.Postprocess(G.Postprocess(["report that", TriggeringEntity, 
                            "{HAVE_PLACEHOLDER} triggered with the",
                            "{CLASS_PLACEHOLDER} type power", Power],
                       tagCopyFun('HAVE_PLACEHOLDER', 'CLASS_PLACEHOLDER',
                                  'OWNER_POSSESSIVE', 'OWNER_NOMINATIVE')),fixTypelessPower),fixIConsumes));
    g.or(["report that", Endbringer, "has been sighted", LocationAt]);
    g.or(["report that", Endbringer, "has been sighted", 
        G.Postprocess([LocationAt, "wearing",Clothing],maskFix)], 0.04);
    g.or(G.Postprocess(["report overhearing a suspicious conversation between", SomeHero, "and a member of", Gang,LocationAt],contessaFix));
    var CitizenExcuse = g;

    // ReporterReason
    g = G.Alt();
    g.or(["discuss the recent victory of", SomeHero, "against", Gang]);
    g.or(["interview", SomeHero, "about the recent spate of", Critter,
         "abductions"]);
    g.or(["interview", SomeHero, "about the recent wave of hate crime against",
          Professionals]);
    g.or(["discuss the use of", Substance, "by", SomeHero, "against",
          Gang]);
    g.or(["ask whether", SomeHero, "left a", ModdedThingy, LocationAt]);
    g.or(G.Postprocess(G.Postprocess(G.Postprocess([G.Alt(['{!OWNER_POSSESSIVE=her}{!OWNER_NOMINATIVE=she}',
    	                            '{!OWNER_POSSESSIVE=his}{!OWNER_NOMINATIVE=he}'])
    	                            ,"ask whether the new cape who has the {CLASS_PLACEHOLDER} type power"
    	                            , Power, "and wears", Clothing ,"is a hero or a villain"],
                       tagCopyFun('HAVE_PLACEHOLDER', 'CLASS_PLACEHOLDER',
                                  'OWNER_POSSESSIVE', 'OWNER_NOMINATIVE')),fixTypelessPower),maskFix)
    );
    g.or(["interview", SomeHero, "about the recent outbreak of", Thingy, 
          "theft"]);
    g.or(["inquire about the rumours which imply that", SomeHeroProblem]);
    g.or(["do research for a human interest piece to", 
        G.Alt(["build sympathy for the human we all know lies","expose the monster"]), 
        "behind", HeroPossessive, "mask"]);
    var ReporterReason = g;
    
    
    g = G.Alt();
    g.or(["hit me with a", SwingThing]);
    g.or(["was last seen", LocationAt, "and is swinging a", SwingThing, "at anyone within reach"]);
    var VillainBehaviour=g;

    // VictimComplaint
    g = G.Alt();
    g.or(["complain that my", ModdedThingy, "has been", PropertyCrimePast, 
          "by", Gang]);
    g.or(G.RollUntil(["complain that", ThirdParty, "has been", PersonCrimePast,
                Gang], contessaFix));
    g.or(["complain that", ThirdParty, "has been hypnotised by", Gang, "into",
          WackyActivityProgressive]);
    g.or(["complain that a villain wearing", Clothing, VillainBehaviour]);
    g.or(["reclaim my stolen", ModdedThingy]);
    var VictimComplaint = g;

    var WrittenWork = G.Alt(["a cookbook", "a propaganda pamphlet",
            "a philosophical treatise", "a bildungsroman", "a romance novel",
            "a dendrology textbook", "a bestselling self-help series", "a galactic guide for hitchhikers", "the new edition of Parahumanology for Dummies", "an urban fantasy", "a poem",
["the unofficial reveal-all biography of",Hero]]);

    g = G.Alt();
    g.or([Num, Unit, "of", Substance]);
    g.or([SomeHero, G.Postprocess([RestraintManner, "restrained in", Restraint],parenthesize)]);
    g.or(["the only", ModdedThingy, "in the world"]);
    g.or(["a", ValueModifier, WeirdThingyTrait, SwingThing]);
    g.or(["a", WeirdCritterTrait, Critter, "and a helicopter full of spaghetti"]);    
    var Ransom = g;

    var Top = G.Alt();
    Top.or(["I'm a concerned citizen. I'm here to", CitizenExcuse]);
    Top.or(["I'm a victim of crime. I'm here to", VictimComplaint]);
    Top.or(["I'm a marketing consultant. I'm here to discuss the design of",
            "the new", Theme, Thingy], 0.08);
    Top.or(["I'm a reporter. I'm here to", ReporterReason], 0.1);
    Top.or(["I'm a writer. I'm here to ask some questions about", SomeHero,
            "as research for", WrittenWork, "I'm writing"], 0.05);
    Top.or(["I'm a janitor. I'm here to clean up a mass of", Substance,
            "which was spilled by", Hero], 0.02);
    Top.or(G.Postprocess(["I have a message from", Gang, "which says that", Hero, 
        "won't see {OWNER_POSSESSIVE} {OWNER_OBJECT} again unless", Ransom, 
        "is delivered to", LocationNone, "by", Time], 
        tagCopyFun('OWNER_POSSESSIVE', 'OWNER_OBJECT')), 0.02);
	Top.or(G.RollUntil(["I'm a repairman. I'm here fix the damage from the recent fight between{B}", 
	    Gang, "{AND}and", Gang], noGangInfighting),0.02); 
    var excuseGen= G.Postprocess(G.Postprocess(Top, removeTags),
                         finalGrammarFixes);
    var powerGen=G.Postprocess(G.Postprocess(YourPower, removeTags),
                         finalGrammarFixes);
    return {'excuse':excuseGen,'power':powerGen};
    function removeTags(s) {
    	s = s.replace('{AND}','','g');
    	s = s.replace('{B}','','g');
    	s = s.replace(/{![^}]*}/g,'');
    	return s; // other tags remain in for debugging purposes
        //return s.replace(/{[^}]*}/g, "");
    }

    function finalGrammarFixes(s) {
        s = s.replace(/\s\s+/g, " ");
        s = s.replace(/\ba ([aeiou])/g, 'an $1');
        return s+".";
    }

    function tagCopyFun() {
        var tags = arguments;
        var copier = function(s) {
            var re;
            for (var i = 0; i < tags.length; ++i) {
                re = RegExp("{!" + tags[i] + "=([^}]*)}");
                if (re.test(s)) {
                    s = s.replace(RegExp("{"+tags[i]+"}"), s.match(re)[1]);
                }
            }
            return s;
        }
        return copier;
    }
}()

function newExcuse() {
    var excuse = excuseGenerator.excuse.generate();
    document.getElementById("excuse").textContent = excuse;
}
function newPower() {
    var power = excuseGenerator.power.generate();
    document.getElementById("power").textContent = power;
}

function bulkGenerate() {
	var j=0;
	var excuses = [];
	var re = RegExp(document.getElementById("match").value);
	for(var i=0;i<10000;i++) {
		var excuse = excuseGenerator.excuse.generate();
		if(re.test(excuse)) excuses[j++] = excuse;
		if(j >= 32){
	        i++; 
	        break;
	    }
	}
	if(excuses.length == 0)
		document.getElementById('excuses').textContent = 'No suitable excuses found.';
	else
		document.getElementById('excuses').textContent =
		j + ' of ' + i + ' excuses found (' + (j/i*100) + ' percent)\n' + 
		excuses.join('\n');
}

function bulkGeneratePowers() {
	var j=0;
	var powers = [];
	var re = RegExp(document.getElementById("match").value);
	for(var i=0;i<10000;i++) {
		var power = excuseGenerator.power.generate();
		if(re.test(power)) powers[j++] = power;
		if(j >= 32){
	        i++; 
	        break;
	    }
	}
	if(powers.length == 0)
		document.getElementById('powers').textContent = 'No suitable powers found.';
	else
		document.getElementById('powers').textContent =
		j + ' of ' + i + ' powers found (' + (j/i*100) + ' percent)\n' + 
		powers.join('\n');
}
