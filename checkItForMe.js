// ==UserScript==
// @name         CheckItForMe
// @version      0.46
// @match        https://scrap.tf/raffles
// @match        https://scrap.tf/raffles/ending
// @require      https://code.jquery.com/jquery-2.2.4.min.js#sha256=BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=
// @updateURL    https://raw.githubusercontent.com/GuilloOme/CheckThisForMe/master/checkItForMe.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var RELOAD_DELAY = 60,
        ERROR_RELOAD_DELAY = 300,
        ENTERING_DELAY = 3,
        TOTAL_ENTRY_THRESHOLD = 300,
        RAFFLE_COUNT_THRESHOLD = 15,
        TIME_LEFT_THRESHOLD = 3600; // in sec: 5400 = 1½hour

    var todoRaffleList = [],
        badRaffleList = [],
        raffleIndex = 0,
        interval = randomInterval(RELOAD_DELAY),
        haveStorageSupport = false,
        botPanel,
        progressBar;

    $(document).ready(function() {

        botPanel = createBotPanel();

        showMessage('Started');
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        if (typeof(Storage) !== "undefined") {
            haveStorageSupport = true;

            // initiate the locals
            if (typeof localStorage.badRaffleList !== 'string') {
                saveBadRaffleList([]);
            }

            if (JSON.parse(localStorage.badRaffleList).length > 1000) {
                console.warn('Purging bad raffle cache!');
                saveBadRaffleList([]);
            } else {
                badRaffleList = JSON.parse(localStorage.badRaffleList);
            }
        }

        if (parseInt($('.user-notices-count').html()) > 0) {
            showMessage('There is new message(s)!');
            showIcon('Ok');
        }


        scanHash();
    });

    function scanHash() {
        var url = window.location.href,
            baseUrl = /https:\/\/scrap.tf\/raffles/;

        if (url.match(baseUrl) && isThereNewRaffles()) {
            scanRaffles();
        } else {
            showMessage('No new raffle to enter, waiting…');

           progressBar = addProgress('', 0, botPanel);
            var timer = 1;
            setInterval(function () {
                updateProgress(progressBar, timer / (interval / 1000));
                timer ++;
            },1000);

            setTimeout(function() {
                location.reload();
            }, interval);
        }

    }

    function scanRaffles() {
        showMessage('Loading all the raffles…');

        $.when(loadAllRaffles()).then(function() {
            var activePanel = $('div.panel');
            $(activePanel[activePanel.length - 1]).find('div.panel-raffle').each(function(id, item) {
                var url = $(item).find('div.raffle-name > a').attr('href');

                if ($(item).css('opacity') === '1' && badRaffleList.indexOf(url) < 0) {
                    todoRaffleList.push(url);
                }
            });

            if (todoRaffleList.length > 0) {
                //showMessage('Start entering raffles.');

                $.when(enterRaffles()).then(function() {
                    //showMessage('Done entering raffles, reloading…');
                    location.reload();
                });
            } else {
                showMessage('No new raffle to enter, waiting…');

               progressBar = addProgress('', 0, botPanel);
                var timer = 1;
                setInterval(function () {
                    updateProgress(progressBar, timer / (interval / 1000));
                    timer ++;
                },1000);

                setTimeout(function() {
                    location.reload();
                }, interval);
            }
        });

    }

    function enterRaffles() {
        var deferred = jQuery.Deferred();

        progressBar = addProgress('', 0, botPanel, 'success');

        function joinRaffle(url) {

            var id, hash;

            ScrapTF.Raffles.EnterRaffle = function(idArg, hashArg) {
                id = idArg;
                hash = hashArg;
            };

            showMessage('Checking raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);
            
            $.get(url, function(responseData) {

                var request,
                    raffleDeferred = jQuery.Deferred(),
                    raffleKey = $(responseData).find("#raffle-key").val(),
                    enterButton = $(responseData).find('button#raffle-enter'),
                    raffleSpecs = getRaffleSpecs(responseData);

                if (isRaffleWorthIt(raffleSpecs)) {

                    if (enterButton.length > 0 && $(responseData).find('button#raffle-enter>i18n').html() === 'Enter Raffle') {
                        showMessage('Entering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);

                        $(responseData).find('button#raffle-enter').click();

                        request = {
                            raffle: id,
                            captcha: '',
                            rafflekey: raffleKey,
                            password: '',
                            hash: hash
                        };

                        ScrapTF.Ajax('viewraffle/EnterRaffle', request, function() {
                            raffleDeferred.resolve('Done entering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length, true);
                        }, function(data) {

                            if (data.captcha) {
                                showIcon('Warning');
                                showNotification('Error when entering raffle:\nCaptcha requested!', 'https://scrap.tf/raffles/' + id);

                                todoRaffleList.forEach(function(url) {
                                    window.open(url);
                                });

                                setTimeout(function() {
                                    location.reload();
                                }, ERROR_RELOAD_DELAY * 1000);

                                raffleDeferred.reject('Captcha requested! Reloading in ' + ERROR_RELOAD_DELAY / 60 + 'minutes…');
                            } else {
                                raffleDeferred.resolve('Error when entering raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length + ' - ' + data.message);
                            }
                        });

                    } else {
                        raffleDeferred.resolve('Can\'t enter raffle: ' + (raffleIndex + 1) + '/' + todoRaffleList.length + ' (no button to click)');
                    }
                } else {
                    badRaffleList.push(url);
                    saveBadRaffleList(badRaffleList);
                    raffleDeferred.resolve('Raffle not worth it: ' + (raffleIndex + 1) + '/' + todoRaffleList.length);
                }

                $.when(raffleDeferred.promise()).then(function(message, haveToWait) {
                    var interval = randomInterval();
                    
                    showMessage(message);

                    updateProgress(progressBar, (raffleIndex + 1) / todoRaffleList.length, (raffleIndex + 1) + '/' + todoRaffleList.length);

                    if(haveToWait){
                        interval = randomInterval(ENTERING_DELAY);
                    }

                    raffleIndex++;
                    if (raffleIndex < todoRaffleList.length) {
                        setTimeout(function() {
                            joinRaffle(todoRaffleList[raffleIndex]);
                        }, interval);
                    } else {
                        deferred.resolve();
                    }
                });

            });

        }

        joinRaffle(todoRaffleList[raffleIndex]);

        return deferred.promise();
    }

    function isThereNewRaffles() {

        var value = $('div.panel-body>div.text-center>i18n>var').text(),
            ar = value.match(/[0-9]+/gi),
            raffleToEnterNumber = (parseInt(ar[1]) - parseInt(ar[0]));

        showMessage('There is ' + raffleToEnterNumber + ' raffle(s) open.');

        return (ar.length > 1 && raffleToEnterNumber > 0);
    }

    function loadAllRaffles() {
        var deferred = jQuery.Deferred();

        var loadInterval = setInterval(function() {

            if (!ScrapTF.Raffles.Pagination.isDone) {
                ScrapTF.Raffles.Pagination.LoadNext();
            } else {
                deferred.resolve();
                clearInterval(loadInterval);
            }

        }, randomInterval());

        return deferred.promise();

    }

    function randomInterval(delay) {
        if (!delay) {
            delay = 0.5;
        }
        return Math.floor(delay * 1000) + Math.floor(Math.random() * (delay * 1000));
    }

    function showIcon(iconType) {
        var iconLink = '';

        if (iconType === 'Ok') {
            iconLink = '<link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG0QYXBtEGTQbRBk8G0QZPBtEGTwbRBk8G0QZPBtEGTwbRBkkG0QYKAAAAAAAAAAAAAAAAAAAAAAAAAAAG0QYQBtEG5wbRBv8G0Qb/BtEG/wbRBv8G0Qb/BtEG/wbRBv8G0Qb/BtEGwAXRBQAAAAAAAAAAAAAAAAAAAAAABtEGOQbRBv/J9cn/z/bP/6bvpv9/53//nO2c/53tnf/u/O7/l+yX/wbRBvkF0QUHAAAAAAAAAAAAAAAAAAAAAAbRBjoG0Qb/2/jb/yjXKP8G0Qb/EdMR/0zeTP9C3EL/6vvq/6TupP8G0Qb5BdEFCAAAAAAAAAAAAAAAAAAAAAAG0QY6BtEG/9v42/8l1yX/BtEG/xHTEf9M3kz/Nto2/7Xxtf+k7qT/BtEG+QXRBQgAAAAAAAAAAAAAAAAAAAAABtEGOgbRBv/b+Nv/jeqN/xjUGP8S0xL/TN5M/zfaN//F9MX/pO6k/wbRBvkF0QUIAAAAAAAAAAAAAAAAAAAAAAbRBjoG0Qb/2/jb//////+B6IH/FNQU/8X0xf+9873/9v32/6TupP8G0Qb5BdEFCAAAAAAAAAAAAAAAAAAAAAAG0QY6BtEG/9v42///////6vvq/w/TD//z/fP///////////+k7qT/BtEG+QXRBQgAAAAAAAAAAAAAAAAAAAAABtEGOQbRBv/T99P/+f75//n++f+b7Zv/9f31//n++f/5/vn/nu2e/wbRBvkF0QUIAAAAAAAAAAAAAAAAAAAAAAbRBhMG0QbtB9EH/wjRCP8I0Qj/CNEI/wjRCP8I0Qj/CNEI/wfRB/8G0QbHBdEFAQAAAAAAAAAAAAAAAAAAAAAAAAAABtEGHwbRBlsG0QZdBtEGXQbRBl0G0QZdBtEGXQbRBl0G0QZWBtEGDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA4AcAAMADAADAAwAAwAMAAMADAADAAwAAwAMAAMADAADAAwAAwAMAAOAHAAD//wAA//8AAA==" rel="icon" type="image/x-icon">';
        } else if (iconType === 'Warning') {
            iconLink = '<link href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAADAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABwAAAAcAAAADAAAAmwAHCcIACQvCAAkLwgAJC8IACQvCAAkLwgAJDMIACQzCAAkMwgAJDMIACQzCAAkMwgAJDMIACArDAAAAmwAAAGsAbIf4AMz//wDM//8AzP//AMz//wDM//8Auun/AK/b/wDM//8AzP//AMz//wDM//8AzP//AGyH+QAAAGsAAAAZAA0QtgC24/8AzP//AMz//wDM//8AzP//Ai86/wMLDf8AwvP/AMz//wDM//8AzP//ALfk/wAOEbgAAAAZAAAAAAAAAFAAT2LqAMz//wDM//8AzP//AMz//wF/n/8CYXn/AMv+/wDM//8AzP//AMz//wBRZesAAABSAAAAAAAAAAAAAAAIAAIDngCcw/8AzP//AMz//wDM//8AeZj/AHSR/wDM//8AzP//AMz//wCfx/8AAwShAAAACQAAAAAAAAAAAAAAAAAAADgAMDzYAMr8/wDM//8AzP//ACQt/wAbIv8AzP//AMz//wDL/f8ANEHbAAAAOwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAfQB9nP4AzP//AMz//wAcI/8AFBj/AMz//wDM//8AgqP+AAAAggAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAGB7DAL/v/wDM//8AFBn/AA0Q/wDL/v8AwvL/ABwjyAAAACcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXwBgePMAy/7/AA0Q/wAHCf8Ayfv/AGaA9gAAAGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEABwisAKvV/wAPE/8ACgz/AK7Z/wAKDLIAAAAVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARgBCUuIAn8f/AJzD/wBLXecAAABNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAGRAI+y/wCZv/8AAQKbAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALwAlLtAALTnWAAAANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABvAAAAeQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAACAAQAAwAMAAMADAADgBwAA8A8AAPAPAAD4HwAA+B8AAPw/AAD8PwAA/n8AAA==" rel="icon" type="image/x-icon">';
        }

        $('link[rel*="icon"]').remove();
        $('head').append(iconLink);

    }

    function showNotification(msg, link) {
        if (Notification.permission === "granted") {
            var notification = new Notification('Notification', {
                icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAADAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABgAAAAYAAAAGAAAABwAAAAcAAAADAAAAmwAHCcIACQvCAAkLwgAJC8IACQvCAAkLwgAJDMIACQzCAAkMwgAJDMIACQzCAAkMwgAJDMIACArDAAAAmwAAAGsAbIf4AMz//wDM//8AzP//AMz//wDM//8Auun/AK/b/wDM//8AzP//AMz//wDM//8AzP//AGyH+QAAAGsAAAAZAA0QtgC24/8AzP//AMz//wDM//8AzP//Ai86/wMLDf8AwvP/AMz//wDM//8AzP//ALfk/wAOEbgAAAAZAAAAAAAAAFAAT2LqAMz//wDM//8AzP//AMz//wF/n/8CYXn/AMv+/wDM//8AzP//AMz//wBRZesAAABSAAAAAAAAAAAAAAAIAAIDngCcw/8AzP//AMz//wDM//8AeZj/AHSR/wDM//8AzP//AMz//wCfx/8AAwShAAAACQAAAAAAAAAAAAAAAAAAADgAMDzYAMr8/wDM//8AzP//ACQt/wAbIv8AzP//AMz//wDL/f8ANEHbAAAAOwAAAAAAAAAAAAAAAAAAAAAAAAABAAAAfQB9nP4AzP//AMz//wAcI/8AFBj/AMz//wDM//8AgqP+AAAAggAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMAGB7DAL/v/wDM//8AFBn/AA0Q/wDL/v8AwvL/ABwjyAAAACcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXwBgePMAy/7/AA0Q/wAHCf8Ayfv/AGaA9gAAAGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABEABwisAKvV/wAPE/8ACgz/AK7Z/wAKDLIAAAAVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARgBCUuIAn8f/AJzD/wBLXecAAABNAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAGRAI+y/wCZv/8AAQKbAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALwAlLtAALTnWAAAANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABvAAAAeQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAACAAQAAwAMAAMADAADgBwAA8A8AAPAPAAD4HwAA+B8AAPw/AAD8PwAA/n8AAA==',
                body: msg
            });
            notification.onclick = function() {
                window.open(link);
                notification.close();
            };
        }
    }

    function getRaffleSpecs(responseData) {
        var itemsData = $(responseData).find('.raffle-items>div'),
            raffle = {
                timeLeft: Math.floor((parseInt($(responseData).find('dd.raffle-time-left').attr('data-time')) - (new Date().getTime() / 1000))),
                winChance: parseInt($(responseData).find('#raffle-win-chance').html()),
                totalEntries: parseInt($(responseData).find('span#raffle-num-entries').attr('data-max')),
                haveSpecials: false, //metal or hats or featured items
                count: 0
            };

        for (var i = 0 ; i <= itemsData.length ; i++) {

            var data = $(itemsData[i]);

            //it's a tf2 item
            if (data.attr('data-appid') === '440') {
                var isHat = function(data) {
                        // any cosmetic or taunt
                        return data.attr('data-slot') === 'misc' || data.attr('data-slot') === 'taunt';
                    },
                    isMetal = function(data) {
                        // any metal or key
                        return data.attr('data-slot') === 'all' && (data.attr('data-title').match('Reclaimed Metal') || data.attr('data-title').match('Refined Metal') || data.attr('data-title').match('Key') || data.attr('data-title').match('Ticket'));
                    },
                    haveFeature = function(data) {
                        var classes = data.attr('class');
                        // killstreak or rare or vintage or genuine or strange or unusuals or token
                        return classes.match('killstreak') || classes.match('rarity') || classes.match('quality3') || classes.match('quality1') || classes.match('quality11') || classes.match('quality5') || classes.match('token');
                    },
                    haveColor = function(data) {
                        return $(data).find('div.paintcolor').length > 0 || $(data).find('img.festive').length > 0;
                    },
                    isSpecials = isMetal(data) || isHat(data) || haveFeature(data) || haveColor(data);

                if (isSpecials) {
                    raffle.haveSpecials = true;
                }

                raffle.count++;
            }

        }

        return raffle;
    }

    function isRaffleWorthIt(raffle) {
        var isIt = false;

        if (raffle.count > 0) {
            if (raffle.haveSpecials) {
                isIt = true;
            } else if (raffle.totalEntries <= TOTAL_ENTRY_THRESHOLD) {
                isIt = true;
            } else if (raffle.count >= RAFFLE_COUNT_THRESHOLD) {
                isIt = true;
            } else if (raffle.timeLeft < TIME_LEFT_THRESHOLD) {
                isIt = true;
            }
        }

        return isIt;
    }

    function saveBadRaffleList(list) {
        if (haveStorageSupport) {
            localStorage.badRaffleList = JSON.stringify(list);
        }
    }

    function createBotPanel(){
        var panel = $('<div class="panel panel-info"><div class="panel-body">Bot: <span class="botMessage"></span></div></div>');

        $('body>div.container').prepend(panel);

        return panel;
    }

    function addProgress( text, percent, botPanel, type) {

        if(!type){
            type = 'info';
        }
        var progress = $('<div class="progress"><div class="progress-bar progress-bar-'+ type +'" role="progressbar" aria-valuenow="'+percent*100+'" aria-valuemin="0" aria-valuemax="100" style="width: '+percent*100+'%;">'+text+'</div></div>');

        botPanel.find('.botMessage').after(progress);

        return progress;
    }

    function updateProgress(progress, percent, text) {
        progress.find('div.progress-bar').attr('aria-valuenow',percent * 100);
        progress.find('div.progress-bar').css('width',percent*100+'%');

        if(text){
            progress.find('div.progress-bar').text(text);
        }
    }

    function showMessage(message) {

        botPanel.find('span.botMessage').text(message);

        console.info(message);
    }

})();
