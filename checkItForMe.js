// ==UserScript==
// @name         CheckItForMe
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://scrap.tf/raffles
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 60;

    $(document).ready(function() {
        scanHash();
    });

    function scanHash() {
        var hash = window.location.hash,
            url = window.location.href,
            u = "https://scrap.tf/raffles";

        if (url === u) {
            console.log("scanning the raffles...");
            scanRaffles();

            // joinRaffle();

            setTimeout(function() {
                location.reload();
            }, RELOAD_DELAY * 1000);
        }

        // if (url.indexOf(u) > -1 && url != u) {
        //     if (hash === "#join") {
        //         console.log("Joining raffle...");
        //     }
        //     else {
        //         window.close();
        //     }
        // }
    }

    function scanRaffles() {

        $.when(scrollToBottom()).then(function() {
            $('div.panel-raffle').each(function(item) {
                // DEBUG:
                console.log(item);
            });
        });

        // $(".panel").each(function() {
        //     pc++;
        //     $(this).attr("id", "raffle-panel-" + pc);
        // });
        //
        // if (pc > 1) {
        //     $("#raffle-panel-1").hide();
        //     cId = "raffle-panel-2";
        // }

        // $(cId).find(".panel-raffle").each(function() {
        //     var o = $(this).css("opacity");
        //     if (o == "0.6") {
        //         $(this).hide();
        //     }
        //     else {
        //         var r = $(this).attr("id"),
        //             raffleId = r.replace("raffle-box-", "");
        //
        //         if (openedTabs < 5) {
        //             var u = window.location.href + "/" + raffleId + "#join";
        //             var win = window.open(u, "", "width=0,height=0");
        //             win.blur();
        //             win.resizeTo(0, 0);
        //             win.moveTo(0, window.screen.availHeight + 10);
        //             openedTabs++;
        //             $(this).css("opacity", "0.6").hide();
        //         }
        //     }
        // });
    }

    function scrollToBottom() {
        var deferred = jQuery.Deferred(),
            keepScrolling = true;

        var scrollInterval = setInterval(function() {

            if (keepScrolling) {
                $('html, body').animate({scrollTop: $(document).height()}, 500);
            } else {
                deferred.resolve();
                clearInterval(scrollInterval);
            }

            keepScrolling = !($('.pag-loading').text() === 'That\'s all, no more!');

        }, 1000);

        return deferred.promise();

    }

    function joinRaffle() {
        window.opener.focus();
        var onclick = $("#raffle-enter").attr('onclick');
        eval("var sc = function(){" + onclick + "}");
        sc();
        window.location.hash = "#";
        setTimeout(function() {
            window.close();
        }, 10000);	// close the page after 10 sec
    }
})();