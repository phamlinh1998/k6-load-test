'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.options = exports.requestCount = exports.failRate = exports.durationTrend = undefined;

exports.default = function () {
    (0, _k.group)("Place Bet Multiple", function () {
        placeBetMultiple();
    });

    (0, _k.sleep)(1);
};

var _http = require('k6/http');

var _http2 = _interopRequireDefault(_http);

var _k = require('k6');

var _uuid = require('./uuid.js');

var _uuid2 = _interopRequireDefault(_uuid);

var _metrics = require('k6/metrics');

var _data = require('k6/data');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var durationTrend = exports.durationTrend = new _metrics.Trend('PlaceBetMultiple Duration');
var failRate = exports.failRate = new _metrics.Rate('PlaceBetMultiple Fail Rate');
var requestCount = exports.requestCount = new _metrics.Counter('PlaceBetMultiple Requests');

var duration = 5000;
var rate = 0.1;

var options = exports.options = {
    stages: [{ duration: '1s', target: 1 }],
    // thresholds: {
    //     'GameBoostrap Duration': ['p(95)<' + duration], // 95% of requests should be below 500ms
    //     'GameBoostrap Fail Rate': ['rate<' + rate] // http errors should be less than 1%
    // }
};

var tokens = new _data.SharedArray('token_data', function () {
    return JSON.parse(open('../data/tokens/token_100_data.json')).tokens;
});

var getToken = function getToken() {
    return tokens[~~(tokens.length * Math.random())];
};


var placeBetMultiple = function placeBetMultiple() {
    var token = getToken().token;
    console.log(token)

    const resHighLight = _http2.default.get('https://' + __ENV.BASE_URL + '/v1/_me/fixtures/highLight', {
        headers: {
            'Content-Type': 'application/json' ,
            'Authorization': 'Bearer ' + token
        }
    });

    console.log('https://' + __ENV.BASE_URL + '/v1/_me/fixtures/highLight')
    // console.log(resHighLight.body)
    var highlights = JSON.parse(resHighLight.body)

    //console.log(highlights)

    const rndInt = Math.floor(Math.random() * 2)
    console.log(rndInt)
    console.log(rndInt)
    console.log(rndInt)
    var countBatch = 1; // so luong log da
    var singles = [];
    for (var i = 0; i < countBatch; i++) {
        //var token = getToken();
        var highlight = highlights[i];
        console.log(highlight)

        var single = {
            betOddsId: highlight.betOdds.id,
            fixtureId: highlight.fixtureId,
            index: highlight.betOdds.odds[rndInt].index,
            oddsId: highlight.betOdds.odds[rndInt].id,
            stake: 10,
            value: Number(highlight.betOdds.odds[rndInt].value),
            time: new Date().getTime() +i//miliSecond

        };
        singles.push(single);
    }
    var placeBet = {
        singles: singles
    }

    console.log(placeBet)
    var res = _http2.default.post('https://' + __ENV.BASE_URL + '/v1/_me/predicts/placeBetSingle', JSON.stringify(placeBet), {
        headers: {
            'Content-Type': 'application/json' ,
            'Authorization': 'Bearer1 ' + token
        }
    });
    console.log('==========res.status')
    console.log(res.status)

    var success = (0, _k.check)(res, {
        "status is 200": function statusIs200(r) {
            return r.status === 200 || r.status === 404;
        }
    });

    if (!success) {
        failRate.add(1);
    } else {
        failRate.add(0);
    }

    durationTrend.add(res.timings.duration);
    requestCount.add(1);
};