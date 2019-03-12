var Game501 = {
	getVisualLeg: function(game, setN, legN) {
		var legRes = {
				player1: game.player1,
				player2: game.player2,
				set: setN,
				leg: legN,
				left1: game.gameLength,
				left2: game.gameLength,
				throw: 0,
				startsFirst: true,
				next: 0,		
				throws: [
					{
						throw1: "",
						left1: game.gameLength, 
						throw2: "",
						left2: game.gameLength,
						throw: 0
					}
				]
			};
		var set = game.game[legRes.set], leg = set[legRes.leg];
		for(i = 0; i < Math.max(leg.firstThrows.length, leg.secondThrows.length); i++) {
			legRes.throws.push({
				throw1: i < leg.firstThrows.length ? leg.firstThrows[i] : "",
				left1: "", 
				throw2: i < leg.secondThrows.length ? leg.secondThrows[i] : "",
				left2: "",
				throw: (i + 1) * 3	
			});
		}
		for(i = 0; i < leg.firstThrows.length; i++) {
			legRes.left1 -= leg.firstThrows[i] % 1000;
			legRes.throws[i + 1].left1 = legRes.left1 == 0 ? "" : legRes.left1;
		}
		for(i = 0; i < leg.secondThrows.length; i++) {
			legRes.left2 -= leg.secondThrows[i] % 1000;
			legRes.throws[i + 1].left2 = legRes.left2 == 0 ? "" : legRes.left2;
		}
		if(legRes.left1 > 0 && legRes.left2 > 0)
			if(leg.firstThrows.length == leg.secondThrows.length) {
				legRes.throws.push({
					throw1: "",
					left1: "", 
					throw2: "",
					left2: "",
					throw: (legRes.throws.length) * 3,
					next: this.isFirstStart(game, setN, legN) ? 1 : 2
				});
				legRes.next = this.isFirstStart(game, setN, legN) ? 1 : 2;
			} else {
				if(this.isFirstStart(game, setN, legN) && leg.firstThrows.length > leg.secondThrows.length) {
					legRes.next = 2;
					legRes.throws[legRes.throws.length-1].next = 2;
				} else {
					legRes.next = 1;
					legRes.throws[legRes.throws.length-1].next = 1;
				}
			}
		return legRes;
	},
	isFirstStart: function(game, setN, legN) {
		if(game.noStartSwap)
			return true;
		return game.noStartSwap || (setN % 2 == 0 ? legN % 2 == 0 : legN % 2 != 0);
	},
	VerifyPlayer: function(game, playerN, throws, stats) {
		let fThrow = 0, fTotal = 0, fDbl = 0, fCl = 0, fBst = 10000, fLwat = 0, player = "player"+playerN;
		for(let i = 0; i < game.game.length; i++) {
			let wl = 0;
			for(let j = 0; j < game.game[i].length; j++) {
				let l = game.game[i][j];
				let fc = 0;
				l[throws].forEach((v) => {
					let vv = v % 1000;
					if(vv == 180) stats["180"][player] += 1;
					else if(vv >= 140) stats["140+"][player] += 1;
					else if(vv >= 100) stats["100+"][player] += 1;
					else if(vv >= 60) stats["60+"][player] += 1;
					fThrow += 1;
					fTotal += vv;
					if(v > 10000)
						stats["HC"][player] = Math.max(stats["HC"][player], vv);
					if(v > 1000)
						fDbl += Math.floor(v % 10000 / 1000);
					if(v > 10000) {
						fc = Math.floor(v / 10000);
						fCl += 1;
						if((playerN == 1) == !this.isFirstStart(game, i, j))
							fLwat += 1;
						stats["WonLegs"][player] += 1;
						wl++;
					}
				});
				if(fc > 0)
					fBst = Math.min(fBst, (l[throws].length - 1) * 3 + fc);
			}
		}
		stats["Av"][player] = fThrow > 0 ? Math.round(fTotal / fThrow) : 0;
		stats["ThrowCount"][player] = fThrow;
		stats["ThrowTotal"][player] = fTotal;
		stats["DoubleThrows"][player] = Math.round(fDbl);
		stats["DoubleSuccess"][player] = fCl;
		stats["Dbls"][player] = fCl + "/" + Math.round(fDbl);
		stats["%"][player] = fDbl > 0 ? Math.round(fCl / fDbl * 100) : 0;
		stats["Best"][player] = fBst == 10000 ? 0 : fBst;
		stats["LWAT"][player] = fLwat;
	},
	Verify: function(game) {
		let stats = {
			"60+": { name: "60+", player1: 0, player2: 0 },
			"100+": { name: "100+", player1: 0, player2: 0 },
			"140+": { name: "140+", player1: 0, player2: 0 },
			"180": { name: "180", player1: 0, player2: 0 },
			"Av": { name: "Av", player1: 0, player2: 0 },
			"HC": { name: "HC", player1: 0, player2: 0 },
			"Dbls": { name: "Dbls", player1: "0/0", player2: "0/0" },
			"%": { name: "%", player1: 0, player2: 0 },
			"Best": { name: "Best", player1: 0, player2: 0 },
			"LWAT": { name: "LWAT", player1: 0, player2: 0 },
			"WonLegs" : { name: "WonLegs", player1: 0, player2: 0 },
			"WonSets" : { name: "WonSets", player1: 0, player2: 0 },
			 "WonGames" : { name: "WonGames", player1: 0, player2: 0 },
			 "LooseGames" : { name: "LooseGames", player1: 0, player2: 0 },
			 "DrawGames" : { name: "DrawGames", player1: 0, player2: 0 },
			"DoubleThrows" : { name: "DoubleThrows", player1: 0, player2: 0 },
			"DoubleSuccess" : { name: "DoubleSuccess", player1: 0, player2: 0 },
			"ThrowCount" : { name: "ThrowCount", player1: 0, player2: 0 },
			"ThrowTotal" : { name: "ThrowTotal", player1: 0, player2: 0 },

		};
		this.VerifyPlayer(game, 1, "firstThrows", stats);
		this.VerifyPlayer(game, 2, "secondThrows", stats);
		this.GetLegs(game);
		stats["WonSets"].player1 = game.wonSets1;
		stats["WonSets"].player2 = game.wonSets2;
		if(game.game.length >= game.setLength || game.wonSets1 > Math.floor(game.setLength / 2) || game.wonSets2 > Math.floor(game.setLength / 2))  {
			if(game.wonSets1 > Math.floor(game.setLength / 2)) {
				game.winner = game.player1;
				stats["WonGames"].player1 = 1;
				stats["LooseGames"].player2 = 1;
				game.finished = true;
			} else if(game.wonSets2 > Math.floor(game.setLength / 2)) {
				game.winner = game.player2;
				stats["WonGames"].player2 = 1;
				stats["LooseGames"].player1 = 1;
				game.finished = true;
			} else if(game.wonSets1 + game.wonSets2 == game.setLength) {
				game.winner = "draw";
				stats["DrawGames"].player1 = 1;
				stats["DrawGames"].player2 = 1;
				game.finished = true;
			}
		}
		return stats;
	},
	GetLegs: function(game) {
		var res = [];
		game.wonSets1 = 0;
		game.wonSets2 = 0;
		for(var i = 0; i < game.game.length; i++) {
			game.game[i].wonLegs1 = 0;
			game.game[i].wonLegs2 = 0;
			for(var j = 0; j <  game.game[i].length; j++) {
				var l = Game501.getVisualLeg(game, i, j);
				res.push(l);
				game.game[i].wonLegs1 += l.left1 > 0 ? 0 : 1;
				game.game[i].wonLegs2 += l.left2 > 0 ? 0 : 1;
			}
			if(game.game[i].wonLegs1 >  Math.floor(game.legLength / 2)) 
				game.wonSets1 += 1;
			if(game.game[i].wonLegs2 >  Math.floor(game.legLength / 2)) 
				game.wonSets2 += 1;
		}
		return res;
	}
};
module.exports = Game501;