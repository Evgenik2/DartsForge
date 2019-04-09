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
                    handler();
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
            <div class="stat-head" :key="item.name" ref="c2000">{{item.name}}</div>
            <div class="stat-value" :key="item.player1" ref="c2001">{{item.player1}}</div>
            <div class="stat-value" :key="item.player2" ref="c2002">{{item.player2}}</div>
        </div>
    `,
    props: {
        item: Object
    }
});
Vue.component("communities-component", {
    template: `
        <div class="menu-row"> 
            <div class="stat-head" v-on:click="selectCommunity" :key="item" ref="c2003">{{item}}</div>
        </div>
    `,
    props: {
        item: Object
    },
    methods: {
        selectCommunity: function (event) {
          keyboardKeys.selectCommunity(this.item);
        }
      },
});
Vue.component("communities-component-communityRating", {
    template: `
        <div class="menu-row"> 
            <div class="community-rating">
                <div class="community-rating-n">{{item.N}}. </div>
                <div class="community-rating-rating" :key="item.Rating" ref="c2004"> {{Math.round(item.Rating)}}</div>
                <div class="community-rating-userName" :key="item.UserName" ref="c2005">{{item.UserName}}</div>
                <div class="community-rating-status loginButton" v-bind:class="{ 'menu-collapsed': !item.changeable }" v-on:click="changeStatus(item); event.preventDefault();" :key="item.Status" ref="c2006">{{item.Status}}</div>
                <div class="community-rating-status" v-bind:class="{ 'menu-collapsed': item.changeable }" :key="item.Status" ref="c2007">{{item.Status}}</div>   
            </div>
        </div>
    `,
    props: {
        item: Object,
        language: languages[settings.language]
    },
    methods: {
        changeStatus: async function(item) {
            if(item.changeable) {
                await DartsApi({ action: 'changePlayerStatus', name: keyboardKeys.community, playerName: item.UserName, status: item.IsReferee ? "Player" : "Referee"});
                await keyboardKeys.updateCommunityData();
            }
        }
    },
});
Vue.component("communities-component-communityEvents", {
    template: `
        <div class="events-row"> 
            <div class="community-rating">
                <div class="community-rating-event-group">
                    <div class="community-rating-rating loginButton" v-on:click="showEvent(); event.preventDefault();" :key="item.Date" ref="c2008">{{item.Date}}</div>
                </div>
                <div class="community-rating-event-group">
                    <div class="community-rating-event loginButton" v-on:click="showEvent(); event.preventDefault();" :key="item.EventName" ref="c2009">{{item.EventName}}</div>
                </div>
                <div class="community-rating-event-group community-rating-event-group-short">
                    <div class="community-rating-event" :key="item.HC" ref="c2010">{{item.HC}}</div>
                </div>
                <div class="community-rating-event-group community-rating-event-group-short">
                    <div class="community-rating-event" :key="item.BestLeg" ref="c2011">{{item.BestLeg}}</div>
                </div>
                <div class="community-rating-userName"></div>
                <div class="community-rating-event-group">
                    <div class="community-rating-status loginButton" v-bind:class="{ 'menu-collapsed': !item.changeable }" v-on:click="changeStatus(item); event.preventDefault();" :key="item.Status" ref="c2012">{{item.Status}}</div>
                    <div class="community-rating-status" v-bind:class="{ 'menu-collapsed': item.changeable }" :key="item.Status" ref="c2013">{{item.Status}}</div>   
                </div>
            </div>
        </div>
    `,
    props: {
        item: Object,
        language: languages[settings.language]
    },
    methods: {
        showEvent: async function(item) {
            keyboardKeys.showEventHistory(this.item);
        },
        changeStatus: async function(item) {
            if(item.changeable) {
                await DartsApi({ action: 'activateCommunityEvent', name: keyboardKeys.community, eventName: item.EventName, active: item.Active ? false : true});
                await keyboardKeys.updateCommunityData();
            }
        }
    },
});

Vue.component("communities-component-history-waiting", {
    template: `
        <div class="menu-row"> 
            <div class="community-message menuelement">
                <div class="menuelement">{{item.timeStampDate}} {{item.player1}} VS {{item.player2}}{{item.language.notPublished}}</div>
                <div class="menu-row" >
                    <div class="dialog-error">{{item.error}}</div>
                </div>
                <div class="message-row"> 
                    <div class="event-button menuelement loginButton" v-on:click="reject(); event.preventDefault();">{{item.language.delete}}</div>
                    <div class="event-button menuelement loginButton" v-on:click="repeat(); event.preventDefault();">{{item.language.repeat}}</div>
                </div>
            </div>
        </div>
    `,
    props: {
        item: Object,
        language: languages[settings.language]
    },
    methods: {
        repeat: function () {
            keyboardKeys.publishGame(this.item);
        },
        reject: function () {
            deleteRecord("History", this.item.timeStamp, ()=> {
                keyboardKeys.updateHistory();
            });
        }
    },
});
Vue.component("communities-component-waitingAgreement", {
    template: `
        <div class="menu-row"> 
            <div class="community-message menuelement">
                <div class="menuelement">{{item.language.courtMessage1}}{{item.CommunityName}}{{item.language.courtMessage2}}</div>
				<div class="event-button menuelement loginButton" v-on:click="reject(); event.preventDefault();">{{item.language.reject}}</div>
            </div>
        </div>
    `,
    props: {
        item: Object,
        language: languages[settings.language]
    },
    methods: {
        reject: function (event) {
            keyboardKeys.rejectCourt(this.item);
        }
    },
});
Vue.component("communities-component-waitingJoining", {
    template: `
        <div class="menu-row"> 
            <div class="community-message">
                <div>{{item.UserName}}{{item.language.joinMessage1}}{{item.CommunityName}}{{item.language.joinMessage2}}</div>
                <div class="message-row"> 
                    <div class="event-button loginButton" v-on:click="reject(); event.preventDefault();">{{item.language.reject}}</div>
				    <div class="event-button loginButton" v-on:click="accept(); event.preventDefault();">{{item.language.apply}}</div>
                </div>
            </div>
        </div>
    `,
    props: {
        item: Object,
        language: languages[settings.language]
    },
    methods: {
        reject: function (event) {
            keyboardKeys.rejectJoin(this.item);
        },        
        accept: function (event) {
            keyboardKeys.acceptJoin(this.item);
        }
    },
});
Vue.component("communities-component-courted", {
    template: `
        <div class="menu-row"> 
            <div class="courted-community">{{item.CommunityName}}</div>
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
Vue.component("profile-stats-component", {
    template: `
        <div class="stat-game-way-item"> 
            <div class="stat-game-way-head profile-stats-item">{{item.name}}</div>
            <div class="stat-game-way profile-stats-item">{{item.value}}</div>
        </div>
    `,
    props: {
        item: Object
    }
});
Vue.component("game-leg-component", {
    template: `
        <div class="scoring-row">
            <div class="scoring-throw scoring-throw-first" v-bind:class="{ 'scoring-throw-red': item.throw1 % 1000 >= 100, 'scoring-throw-next': item.next == 1 }" :key="item.throw1" ref="c2015">{{item.throw1 === "" ? "" : (item.throw1 >= 10000 ? "X" + Math.floor(item.throw1 / 10000) : item.throw1 % 1000) + "*".repeat(Math.floor(item.throw1 % 10000 / 1000))}}</div>
            <div class="scoring-throw" :key="item.left1" ref="c2016">{{item.left1}}</div>
            <div class="scoring-throw scoring-throw-number" :key="item.throw" ref="c2017">{{item.throw}}</div>
            <div class="scoring-throw" :key="item.left2" ref="c2018">{{item.left2}}</div>
            <div class="scoring-throw scoring-throw-second" v-bind:class="{ 'scoring-throw-red': item.throw2 % 1000 >= 100, 'scoring-throw-next': item.next == 2 }" :key="item.throw2" ref="c2019">{{item.throw2 === "" ? "" : (item.throw2 >= 10000 ? "X" + Math.floor(item.throw2 / 10000) : item.throw2 % 1000) + "*".repeat(Math.floor(item.throw2 % 10000 / 1000))}}</div>
        </div>
    `,
    props: {
        item: Object
    }
});
Vue.component("history-component", {
    template: `
        <div class="history-item" v-on:click="showHistoryItem(item.timeStamp)"> 
            <!--<div class="history-timeStamp">{{item.startTime}}</div>-->
            <div class="scoring-row">
                <div class="stat-game-way-player"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">{{new Date(item.timeStamp).toLocaleString()}}</div>
                    <div class="stat-game-way-head" v-bind:class="{  'stat-gip': kind=='gip', 'stat-game-way-winner': item.finished && item.winner==item.player1 }">{{item.player1}}</div>
                    <div class="stat-game-way-head" v-bind:class="{  'stat-gip': kind=='gip', 'stat-game-way-winner': item.finished && item.winner==item.player2 }">{{item.player2}}</div>
                </div>
                <div class="stat-game-way-item" v-bind:class="{ 'element-collapsed': item.setLength==1 }"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">Sets</div>
                    <div class="stat-game-way">{{item.wonSets1}}</div>
                    <div class="stat-game-way">{{item.wonSets2}}</div>
                </div>
                <div class="stat-game-way-item" v-bind:class="{ 'element-collapsed': item.setLength!=1 }"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">Legs</div>
                    <div class="stat-game-way">{{item.wonLegs1}}</div>
                    <div class="stat-game-way">{{item.wonLegs2}}</div>
                </div>
                <div class="stat-game-way-item"v-bind:class="{ 'element-collapsed': item.finished }"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">Score</div>
                    <div class="stat-game-way" v-if="item.legs" v-bind:class="{ 'scoring-throw-next': item.legs[item.legs.length - 1].next == 1 }">{{item.legs[item.legs.length - 1].left1}}</div>
                    <div class="stat-game-way" v-if="item.legs" v-bind:class="{ 'scoring-throw-next': item.legs[item.legs.length - 1].next == 2 }">{{item.legs[item.legs.length - 1].left2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[0]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">100+</div>
                    <div class="stat-game-way">{{item.stats[0].player1}}</div>
                    <div class="stat-game-way">{{item.stats[0].player2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[1]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">140+</div>
                    <div class="stat-game-way">{{item.stats[1].player1}}</div>
                    <div class="stat-game-way">{{item.stats[1].player2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[2]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">180</div>
                    <div class="stat-game-way">{{item.stats[2].player1}}</div>
                    <div class="stat-game-way">{{item.stats[2].player2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[3]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">Av</div>
                    <div class="stat-game-way">{{item.stats[3].player1}}</div>
                    <div class="stat-game-way">{{item.stats[3].player2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[4]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">HC</div>
                    <div class="stat-game-way">{{item.stats[4].player1}}</div>
                    <div class="stat-game-way">{{item.stats[4].player2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[5]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">Dbls</div>
                    <div class="stat-game-way">{{item.stats[5].player1}}</div>
                    <div class="stat-game-way">{{item.stats[5].player2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[6]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">%</div>
                    <div class="stat-game-way">{{item.stats[6].player1}}</div>
                    <div class="stat-game-way"item>{{item.stats[6].player2}}</div>
                </div>
                <div class="stat-game-way-item" v-if="item.stats[7]"> 
                    <div class="stat-game-way-head" v-bind:class="{ 'stat-gip': kind=='gip' }">Best</div>
                    <div class="stat-game-way">{{item.stats[7].player1}}</div>
                    <div class="stat-game-way">{{item.stats[7].player2}}</div>
                </div>
            </div>
        </div>
    `,
    props: {
        item: Object,
        kind: Object
    },
    methods: {
        showHistoryItem: function(timestamp) {
            if(this.kind == "history")
                keyboardKeys.showHistoryItem(timestamp);
            else
                keyboardKeys.showEventHistoryItem(timestamp);
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