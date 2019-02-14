Vue.directive('longpress', {
    bind: function (el, binding, vNode) {
        // Make sure expression provided is a function
        if (typeof binding.value !== 'function') {
            // Fetch name of component
            const compName = vNode.context.name;
            // pass warning to console
            let warn = `[longpress:] provided expression '${binding.expression}' is not a function, but has to be`
            if (compName) { warn += `Found in component '${compName}' ` }

            console.warn(warn);
        }

        // Define variable
        let pressTimer = null

        // Define funtion handlers
        // Create timeout ( run function after 1s )
        let start = (e) => {

            if (e.type === 'click' && e.button !== 0) {
                return;
            }

            if (pressTimer === null) {
                pressTimer = setTimeout(() => {
                    // Run function
                    handler()
                }, 1000)
            }
        }

        // Cancel Timeout
        let cancel = (e) => {
            // Check if timer has a value or not
            if (pressTimer !== null) {
                clearTimeout(pressTimer)
                pressTimer = null;
            }
        }
        // Run Function
        const handler = (e) => {
            binding.value(e);
        }

        // Add Event listeners
        el.addEventListener("mousedown", start, { passive: false });
        el.addEventListener("touchstart", start, { passive: false });
        // Cancel timeouts if this events happen
        el.addEventListener("click", cancel, { passive: false });
        el.addEventListener("mouseout", cancel, { passive: false });
        el.addEventListener("touchend", cancel, { passive: false });
        el.addEventListener("touchcancel", cancel, { passive: false });
    }
});
Vue.component("stats-component", {
    template: `
        <div class="stat-item"> 
            <div class="stat-head">{{item.name}}</div>
            <div class="stat-value">{{item.player1}}</div>
            <div class="stat-value">{{item.player2}}</div>
        </div>
    `,
    props: {
        item: Object
    }
});
Vue.component("game-way-component", {
    template: `
        <div class="stat-game-way-item"> 
            <div class="stat-game-way-head">{{item.name}}</div>
            <div class="stat-game-way">{{item.player1}}</div>
            <div class="stat-game-way">{{item.player2}}</div>
        </div>
    `,
    props: {
        item: Object
    }
});
Vue.component("game-leg-component", {
    template: `
        <div class="scoring-row">
            <div class="scoring-throw scoring-throw-first" v-bind:class="{ 'scoring-throw-red': item.throw1 % 1000 >= 100, 'scoring-throw-next': item.next == 1 }">{{item.throw1 === "" ? "" : (item.throw1 >= 10000 ? "X" + Math.floor(item.throw1 / 10000) : item.throw1 % 1000) + "*".repeat(Math.floor(item.throw1 % 10000 / 1000))}}</div>
            <div class="scoring-throw">{{item.left1}}</div>
            <div class="scoring-throw scoring-throw-number">{{item.throw}}</div>
            <div class="scoring-throw">{{item.left2}}</div>
            <div class="scoring-throw scoring-throw-second" v-bind:class="{ 'scoring-throw-red': item.throw2 % 1000 >= 100, 'scoring-throw-next': item.next == 2 }">{{item.throw2 === "" ? "" : (item.throw2 >= 10000 ? "X" + Math.floor(item.throw2 / 10000) : item.throw2 % 1000) + "*".repeat(Math.floor(item.throw2 % 10000 / 1000))}}</div>
        </div>
    `,
    props: {
        item: Object
    }
});
Vue.component("history-component", {
    template: `
        <div class="history-item" v-on:click="showHistoryItem(item.timeStamp)"> 
            <div class="history-timeStamp">{{item.startTime}}</div>
            <div class="scoring-row">
                <div class="stat-game-way-player"> 
                    <div class="stat-game-way-head"></div>
                    <div class="stat-game-way-head">{{item.player1}}</div>
                    <div class="stat-game-way-head">{{item.player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">Sets</div>
                    <div class="stat-game-way">{{item.wonSets1}}</div>
                    <div class="stat-game-way">{{item.wonSets2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">100+</div>
                    <div class="stat-game-way">{{item.stats[0].player1}}</div>
                    <div class="stat-game-way">{{item.stats[0].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">140+</div>
                    <div class="stat-game-way">{{item.stats[1].player1}}</div>
                    <div class="stat-game-way">{{item.stats[1].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">180</div>
                    <div class="stat-game-way">{{item.stats[2].player1}}</div>
                    <div class="stat-game-way">{{item.stats[2].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">Av</div>
                    <div class="stat-game-way">{{item.stats[3].player1}}</div>
                    <div class="stat-game-way">{{item.stats[3].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">HC</div>
                    <div class="stat-game-way">{{item.stats[4].player1}}</div>
                    <div class="stat-game-way">{{item.stats[4].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">Dbls</div>
                    <div class="stat-game-way">{{item.stats[5].player1}}</div>
                    <div class="stat-game-way">{{item.stats[5].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">%</div>
                    <div class="stat-game-way">{{item.stats[6].player1}}</div>
                    <div class="stat-game-way"item>{{item.stats[6].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">Best</div>
                    <div class="stat-game-way">{{item.stats[7].player1}}</div>
                    <div class="stat-game-way">{{item.stats[7].player2}}</div>
                </div>
                <div class="stat-game-way-item"> 
                    <div class="stat-game-way-head">LWAT</div>
                    <div class="stat-game-way">{{item.stats[8].player1}}</div>
                    <div class="stat-game-way">{{item.stats[8].player2}}</div>
                </div>
            </div>
        </div>
    `,
    props: {
        item: Object
    },
    methods: {
        showHistoryItem: function(timestamp) {
            keyboardKeys.showHistoryItem(timestamp);
        }
    }
});
Vue.component("game-set-component", {
    template: `
        <div class="scoring-data">
            <div class="scoring-head">
                <div class="scoring-player">{{item.player1}}</div>
                <div class="scoring-leg-group">
                    <div class="scoring-leg">
                        Set {{item.set + 1}}
                    </div>
                    <div class="scoring-leg-separator"></div>
                    <div class="scoring-leg">
                        Leg {{item.leg + 1}}
                    </div>
                </div>
                <div class="scoring-player">{{item.player2}}</div>
            </div>
            <div id="scoring-throws-group">
                <game-leg-component is="game-leg-component" v-for="item in item.throws" v-bind:item="item" v-bind:key="item.name">
                </game-leg-component>
            </div>
        </div>
    `,
    props: {
        item: Object,
        language: languages[settings.language]
    }
});