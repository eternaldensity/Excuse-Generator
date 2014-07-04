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
                      
    var Hero = G.Alt(["Armsmaster", "Alexandria", "Eidolon", "Legend",
            "Chevalier", "Miss Militia", "Mouse Protector", "Myrddin", "Chubster", /*"Dauntless" NOPE not him */ "Narwhal", "Dragon"]);
    var Endbringer = G.Alt(["Simurgh", "Ziz", "Leviathan", "Behemoth",
            "Hadhayosh"]);
    var Professionals = G.Alt(["accountants", "auto mechanics", "clowns",
            "pro wrestlers", "divorce lawyers", "barbers", "nightclub bouncers"]);
    var Gang = G.Alt(["the Empire 88",
                      "the Azn Bad Boys",
                      "the Merchants",
                      contessa,
                      "the Slaughterhouse 9",
                      "some meddling teenagers in a van",
                      "the local chapter of the Hell's Angels",
                      "the Girl Scouts' cookie-selling brigade",
			"the League of Door to Door Salesmen",
			"an angry swarm of BEES", "THE TECHNO QUEEN'S DASTARDLY TECHIES"]);
    var LocationsRaw = G.Alt([
	    "in@into@ the nearby park",
	    "at@to@   the beach",
	    "at@to@   Fugly Bob's",
	    "in@into@ Fortress Construction's board meeting room",
	    "at@to@   the local retirement home",
	    "in@into@ my neighborhood",
	    "in@into@ my mailbox",
	    "on@onto@ my roof",
	    "in@into@ the rusted hulk of a ship",
	    "in@into@ the post office",
	    "inside@into@ Arcadia High",
	    "in@into@ the Winslow High girls' locker room",
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
    var LocationTo = G.Postprocess(LocationsRaw, mapLocationsTo);
    var LocationAt = G.Postprocess(LocationsRaw, mapLocationsAt);
    var Thingy = G.Alt(["wristwatch", "underwear", "necktie", "lunchbox",
            "wallet", "cellphone", "baseball cap", "monocle", "waffle",
            "buzzsaw", "saucepan", "HDMI cable", "sock", "toaster oven",
	"muffin", "t-shirt", "belt and suspenders", "vase", "sippy cup", "beer coaster",
	"vegetable peeler", "fruit juicer", "blender", "fedora"]);
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

    var Critter = G.Alt(["kitten", "squirrel", "puppy", "hedgehog", "pony",
                         "antelope", "sugar ant", "black widow spider"]);
    var WeirdCritterTrait = G.Alt(["pink", "sapient", "flying", "tentacled",
            "insectoid", "gargantuan", "glittery", "long-toothed", "slimy", "skinny", "eldrich"]);
    var Substance = G.Alt(["ice cream", "candy", "cocaine", "psychic energy",
            "liquid nitrogen", "radioactive sludge", "jello", "clay","solidified air",
		"orphans' tears", "hot buttered popcorn", "coffee beans", "powdered water", "bubbly champagne",["powdered", [Endbringer], "figurines"],
            ["liquefied", Critter, "flesh"]]);
    var ThirdParty = G.Alt([["my pet", Critter], "my son", "my daughter", "my evil twin", "your mom", "my red-headed stepchild"]);
    var PersonCrimePast = G.Alt(["pranked by",
            "asked on a date by a member of", "tickled by", "glared at by",
	 "winked at by", "ignored by", "recruited by", ["teleported",LocationTo, "by"], "sent to the future by", "mindswapped with", "mistaken for"]);
    var PropertyCrimePast = G.Alt(["stolen", "defaced", "ruined with spilled lemonade",
            "vandalised", "spray painted", "replaced with a mirror image", "sent to Earth Aleph", "hidden in the Boat Graveyard", ["fed to",ThirdParty]]);
    var ValueModifier = G.Alt(["vintage", "antique", "priceless",
            "limited edition", "autographed", "heirloom", "foil"]);
    var QualityModifier = G.Alt(["tinkertech", "handcrafted", "masterwork",
            "customized", "dwarven", "restored", "recycled", "damaged"]);
    var Theme = G.Postprocess(Hero, function (s) { return s + "-themed"; });

	var WorldEffect = G.Alt(["appropriate theme music", "inappropriate theme music", "everyone's most hated earworms", "the Inception BWONG at dramatic moments", "Kung Fu movie captions", "the Lost City of Atlantis", "disco lights", "the sound of drums"]);

    // These results can be salvaged instead of rerolling.
    function contessaFix(str) {
    	str = str.replace('a member of ' + contessa, contessa, 'g');
    	str = str.replace('superpowered members of ' + contessa, contessa, 'g');
    	str = str.replace('members of ' + contessa, contessa, 'g');
    	return str;
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
    g.or("of acute alliteration{!CLASS_PLACEHOLDER=thinker}");
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
    g.or(["{!CLASS_PLACEHOLDER=stranger}to exactly impersonate",Hero,"whenever {OWNER_NOMINATIVE} consume", Substance]);
    g.or(["{!CLASS_PLACEHOLDER=stranger}to become invisible to",
          G.Alt(["redheaded", "bald", "mohawk sporting", "mullet bearing"]),
          Professionals, "wearing", G.Alt(["yarmulkas", "top hats", 
                                           "flip-flops", "togas"])]);
    var Power = g;

    g = G.Alt(['{!OWNER_POSSESSIVE=her}{!OWNER_NOMINATIVE=she}','{!OWNER_POSSESSIVE=his}{!OWNER_NOMINATIVE=he}']);
    var SomeHero = G.Alt([Hero, G.Postprocess([
    	               G.Alt(['{!OWNER_POSSESSIVE=her}{!OWNER_NOMINATIVE=she}',
    	                      '{!OWNER_POSSESSIVE=his}{!OWNER_NOMINATIVE=he}']),
    	               "that new hero with the power", Power],
                       tagCopyFun('HAVE_PLACEHOLDER', 'CLASS_PLACEHOLDER',
                                  'OWNER_POSSESSIVE', 'OWNER_NOMINATIVE'))]);

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
    g.or(G.Postprocess(["report that", TriggeringEntity, 
                            "{HAVE_PLACEHOLDER} triggered with the",
                            "{CLASS_PLACEHOLDER} type power", Power],
                       tagCopyFun('HAVE_PLACEHOLDER', 'CLASS_PLACEHOLDER',
                                  'OWNER_POSSESSIVE', 'OWNER_NOMINATIVE')));
    g.or(["report that", Endbringer, "has been sighted", LocationAt]);
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
    g.or(["interview", SomeHero, "about the recent outbreak of", Thingy, 
          "theft"]);
    var ReporterReason = g;

    // VictimComplaint
    g = G.Alt();
    g.or(["complain that my", ModdedThingy, "has been", PropertyCrimePast, 
          "by", Gang]);
    g.or(G.RollUntil(["complain that", ThirdParty, "has been", PersonCrimePast,
                Gang], contessaFix));
    g.or(["complain that", ThirdParty, "has been hypnotised by", Gang, "into",
          WackyActivityProgressive]);
    g.or(["reclaim my stolen", ModdedThingy]);
    var VictimComplaint = g;

    var WrittenWork = G.Alt(["a cookbook", "a propaganda pamphlet",
            "a philosophical treatise", "a bildungsroman", "a romance novel",
            "a dendrology textbook", "a bestselling self-help series", "a galactic guide for hitchhikers", "the new edition of Parahumanology for Dummies", "an urban fantasy", "a poem",
["the unofficial reveal-all biography of",Hero]]);

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
	Top.or(G.RollUntil(["I'm a repairman. I'm here fix the damage from the recent fight between{B}", Gang, "{AND}and", Gang], noGangInfighting),0.02); 
    return G.Postprocess(G.Postprocess(Top, removeTags),
                         finalGrammarFixes);

    function removeTags(s) {
    	s = s.replace('{AND}','','g');
    	s = s.replace('{B}','','g');
    	s = s.replace(/{![^}]*}/g,'');
    	return s; // other tags remain in for debugging purposes
        //return s.replace(/{[^}]*}/g, "");
    }

    function finalGrammarFixes(s) {
        s = s.replace(/\s+/, " ");
        s = s.replace(/\ba ([aeiou])/, 'an $1');
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
    var excuse = excuseGenerator.generate();
    document.getElementById("excuse").textContent = excuse;
}

function bulkGenerate() {
	var j=0;
	var excuses = [];
	var re = RegExp(document.getElementById("match").value);
	for(var i=0;i<10000;i++) {
		var excuse = excuseGenerator.generate();
		if(re.test(excuse)) excuses[j++] = excuse;
		if(j > 32) break;
	}
	if(excuses.length == 0)
		document.getElementById('excuses').textContent = 'No suitable excuses found.';
	else
		document.getElementById('excuses').textContent =
		j + ' of ' + i + ' excuses found (' + (j/i*100) + ' percent)\n' + 
		excuses.join('\n');
}
