DECK_NUM = 2;
SUIT_NUM = 4;
VALUE_NUM = 13;
JOKER_NUM =2;
ALL_SUIT =['spades','hearts','diamonds','clubs','jokers'];
function Card(my_suit,my_value){
    this.suit = my_suit;
    this.value = my_value;

}

function This_round(){

}
function playerProperty(players){
    for(var i = 0 ;i < players.length; i++){
        players[i].cards = [];
        players[i].suit = new Array(4);
        for(var j =0 ;j<ALL_SUIT.length ; j++){
            players[i].suit[j] = [];
        }
        players[i].points = 0;  //point is for this game
        players[i].score = 0;   //score is for the whole game
        players[i].declarer = -1;  // 0 is false, 1 is true, -1 is undefined.
        players[i].mynum = -1;
    }
}
function shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

function Deck(){
    var deck = [];

    for(var i = 0; i <DECK_NUM; i++ ){
        for ( var j = 0 ; j< SUIT_NUM; j++){
            for( var k =0 ; k < VALUE_NUM ; k++){
                deck.push(new Card(ALL_SUIT[j],k+1))
            }
        }
        for( var j =0; j < JOKER_NUM ; j ++){
            deck.push(new Card(ALL_SUIT[4],j+1))
        }
    }
    shuffle(deck);
    return deck;
}

function GameInfo(){
    this.dominantSuit = 'unknown';
    this.dominantRank = 2;
    this.starter = -1; //should be one of player 0 to 3
    this.tempPos = -1;
    this.count = -1;
    this.cardsLeft = -1;

}

function Dealing(players, gameInfo){
    console.log('Start dealing');
    var deck= Deck();
    //console.log(deck);
    //console.log(deck.length);
    var n = deck.length;
    var i = gameInfo.starter;

    var de = setInterval(function(){

        n -= 1;
        i = i%4;
        players[i].cards.push(deck[n]);
        players[i].emit('newcard', deck[n]);
        //TODO: determining the dominant suit and rank
        i = i +1;
        if (n === 0){
            clearInterval(de);
            sortCards(players);
//            for(var j = 0 ; j<4; j++){
//                console.log(players[j].cards.length)
//
//                //players[j].emit('mycards', players[j].cards);
//            }
        }
    },30)
}


function find(player,target){
    for(var i = 0; i< 5; i++){
        if(ALL_SUIT[i] === target.suit){
            for(var j =0 ;j< player.suit[i].length ; j++){
                if(target.value === player.suit[i][j].value){
                    return [i,j];
                }
            }
        }
    }
    return [-1,-1];
}
function debug(message){
    console.log(message +'---------------------------------');
}
function sortCards(players){

    //ALL_SUIT 'spades','hearts','diamonds','clubs','jokers'
    for(var k = 0 ; k <4 ;k++){
        for(var i=0 ; i< players[k].cards.length ; i++){
            for(var j =0 ; j < ALL_SUIT.length ; j++){
                if(ALL_SUIT[j] === players[k].cards[i].suit){
                    players[k].suit[j].push(players[k].cards[i]);
                }
            }
        }
        for(var i =0 ;i<ALL_SUIT.length; i++){
            players[k].suit[i].sort(function(a,b){return b.value - a.value });
        }
        //console.log('Hi, I am here gg');
        updateHand(players[k]);
    }

}


function deleteHand(player,cardsCombination){
    console.log(cardsCombination);
    //console.log(player.cards);

    // first make sure you have the cards you want to play
    var cardsPosition = [];  // store the position of the cards in my hands
    for(var i = 0; i<cardsCombination.length; i++){
        var index = find(player,cardsCombination[i]);
        if(index[0] === -1){
            return -1;  // card not exists
        }
        cardsPosition.push(index);
    }

    //check all the rules, make sure it's legal


    //it's legal, so delete the cards in my hands.
    for(var i =0;i<cardsCombination.length;i++){
        var index = find(player,cardsCombination[i]);
        player.suit[index[0]].splice(index[1],1);
        //console.log(player.cards);
        //console.log(index);
        //console.log('length '+ player.cards.length);
        debug('deletedone');
        return 1;  //means good
    }
}
function updateHand(player){
    player.cards = [];
    for(var i = 0; i< ALL_SUIT.length; i++){
        for(var j =0 ; j< player.suit[i].length; j++){
            player.cards.push(player.suit[i][j])
        }
    }
    //console.log(player.cards);
    //console.log(player.suit[0]);
    player.emit('updateHand', player.cards);
}


function do_trick(player, gameInfo, callback){

    player.on('usecard', function(result) {
        debug(2);
        var oneCard = new Card(result.suit,parseInt(result.value));
        console.log('gamecore:: ' + player.userid + ' used card ' + result.suit + ' ' + result.value);
        //TODO: It should be possible to play more than one card
        // Now I just made one value array;
        var cardsCombination = [];
        cardsCombination.push(oneCard);
        var isLegal = deleteHand(player , cardsCombination);  // -1 means not legal
        // if want he want to play is not legal. Tell him.
        if (isLegal === -1){
            callback(-1);
        }
        else{
            //debug(5);
            updateHand(player);
            player.broadcast.to(player.game).emit('otherTricks',result);
            player.emit('otherTricks',result);
            //next
            gameInfo.starter = ((gameInfo.starter + 1)%4);
            player.emit('stop');
            player.broadcast.to(player.game).emit('stop');
            callback(1);
        }
    })
}


function countCardsinHand(player){
    var num =0;
    for(var i =0;i<5;i++){
        num += player.suit[i].length;
    }
    return num;
}


function one_round(players,gameInfo, callBack){
    // set them all not able to submit information.
    console.log('one_round');
    if(gameInfo.count < 4){
        var i = gameInfo.starter;
        //debug(9);
        do_trick(players[i],gameInfo,function(result){
            //debug(88);
            if(result === 1){
                //debug(3);
                gameInfo.count++;
                i = gameInfo.starter;
                players[i].emit('go');
                players[i].broadcast.to(players[i].game).emit('stop');
                one_round(players,gameInfo ,callBack);
            }
            else if(result === -1){
                //debug(11)
                players[i].emit('DoAgain');
                //players[i].broadcast.to(players[i].game).emit('stop');
                //one_round(players,gameInfo ,callBack);
            }
            else{
                debug(result);
                debug(99);

            }
        })
    }
    else{
        console.log('One loop done');
        gameInfo.cardsLeft = countCardsinHand(players[0]); //everyone has same number of cards
        callBack(gameInfo);
    }

}


//
//function do_trick(player, gameInfo, callback){
//
//    player.on('usecard', function(result) {
//        debug(2);
//        var oneCard = new Card(result.suit,parseInt(result.value));
//        console.log('gamecore:: ' + player.userid + ' used card ' + result.suit + ' ' + result.value);
//        //TODO: It should be possible to play more than one card
//        // Now I just made one value array;
//        var cardsCombination = [];
//        cardsCombination.push(oneCard);
//        var isLegal = deleteHand(player , cardsCombination);  // -1 means not legal
//        // if want he want to play is not legal. Tell him.
//        if (isLegal === -1){
//            //debug(6);
//            //console.log('Im here');
//            debug(31);
//            callback(-1);
//        }
//        else{
//            debug(5);
//            updateHand(player);
//            player.broadcast.to(player.game).emit('otherTricks',result);
//            player.emit('otherTricks',result);
//            //next
//            gameInfo.starter = ((gameInfo.starter + 1)%4);
//            player.emit('stop');
//            player.broadcast.to(player.game).emit('stop');
//            callback(1);
//        }
//    })
//}
//
//
//function countCardsinHand(player){
//    var num =0;
//    for(var i =0;i<5;i++){
//        num += player.suit[i].length;
//    }
//    return num;
//}
//
//
//function one_round(players,gameInfo, callBack){
//    // set them all not able to submit information.
//    console.log('one_round');
//    if(gameInfo.count < 4){
//        var i = gameInfo.starter;
//        debug(9);
//        do_trick(players[i],gameInfo,function(result){
//            debug(88);
//            if(result === 1){
//                debug(3);
//                gameInfo.count++;
//                i = gameInfo.starter;
//                players[i].emit('go');
//                players[i].broadcast.to(players[i].game).emit('stop');
//                one_round(players,gameInfo ,callBack);
//            }
//            else if(result === -1){
//                debug(11)
//                players[i].emit('DoAgain');
//                //players[i].broadcast.to(players[i].game).emit('stop');
//                one_round(players,gameInfo ,callBack);
//            }
//            else{
//                debug(result);
//                debug(99);
//
//            }
//        })
//    }
//    else{
//        console.log('One loop done');
//        gameInfo.cardsLeft = countCardsinHand(players[0]); //everyone has same number of cards
//        callBack(gameInfo);
//    }
//
//}

function playing(players,gameInfo){
    console.log('OK. please start your trick');
    var done = false;

    gameInfo.count = 0;
    var i = gameInfo.starter;
    players[i].emit('go');
    players[i].broadcast.to(players[i].game).emit('stop');
    //player.broadcast.to(player.game).emit('otherTricks',result);
    one_round(players,gameInfo,function(result){
        if(result === 0 ){
            //this game is done

        }
        else{
            // go to next round
            debug('next round');
            playing(players,gameInfo);
        }
    });



}

function updateScore(players){

}


function One_game(players,gameInfo){
    Dealing(players,gameInfo);

    // updateScore(players);
    playing(players,gameInfo);
}


var game_core= function (game_instance) {
    //Store the instance, if any
    this.instance = game_instance;
    //console.log(game_instance.id)
    //console.log(game_instance);
    //Store a flag if we are the server
    this.server = this.instance !== undefined;
    var players = [];
    for(var i = 0 ; i< 3; i++){
        players[i] = game_instance.player_client[i];
        players[i].emit('initial');
    }
    players[3]=game_instance.player_host;
    players[3].emit('initial');
    playerProperty(players);
    //console.log(players)
    var gameInfo = new GameInfo();
    gameInfo.starter = 0;  // 0 ,1, 2, 3
    gameInfo.tempPos = gameInfo.starter;
    One_game(players,gameInfo);

};


//server side we set the 'game_core' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global ) {
    module.exports = global.game_core = game_core;
}
