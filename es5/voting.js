'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.options = exports.requestCount = exports.failRate = exports.durationTrend = undefined;

exports.default = function () {
    (0, _k.group)("voting", function () {
        voting();
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

var durationTrend = exports.durationTrend = new _metrics.Trend('voting Duration');
var failRate = exports.failRate = new _metrics.Rate('voting Fail Rate');
var requestCount = exports.requestCount = new _metrics.Counter('voting Requests');

var duration = 5000;
var rate = 0.1;

var options = exports.options = {
    stages: [{ duration: '60s', target: 1 }],
    // thresholds: {
    //     'GameBoostrap Duration': ['p(95)<' + duration], // 95% of requests should be below 500ms
    //     'GameBoostrap Fail Rate': ['rate<' + rate] // http errors should be less than 1%
    // }
};

var tokens = new _data.SharedArray('token_data', function () {
    return JSON.parse(open('../data/tokens/token_voting.json')).tokens;
});

var getToken = function getToken() {
    return tokens[~~(tokens.length * Math.random())];
};

var voting = function voting() {
    const resQuestion = _http2.default.get('https://' + __ENV.BASE_URL + '/v1/predict2/questions', {
        headers: {
            'Content-Type': 'application/json' ,
            'x-wi-token': '8000',
            'x-user-id': __ENV.TENANT
        }
    });
    var questions = JSON.parse(resQuestion.body)


    var countBatch = 10; // so luong log da
    for (var i = 0; i < countBatch; i++) {
        var token = getToken().token;

        var votingDto;
        const rndInt = Math.floor(Math.random() * questions.length)
        var question = questions[rndInt];
        switch (question.type) {
            case 'SELECTED':
                votingDto= {
                    questionId: question.id,
                    answers:[
                        {
                            answerId: question.answerChoose[0].id,
                            value:0
                        }
                    ]
                };
                break;
            case 'INPUT':
                votingDto= {
                    questionId: question.id,
                    answers:[
                        {
                            answerId:question.answerChoose[0].id,
                            value:3
                        },
                        {
                            answerId:question.answerChoose[1].id,
                            value:2
                        }
                    ]
                };
                break;
            case 'SELECTED_INPUT':
                votingDto= {
                    questionId: question.id,
                    answers:[
                        {
                            answerId:question.answerChoose[0].id,
                            value:98
                        },
                    ]
                };
                break;
        }

        const res = _http2.default.post('https://' + __ENV.BASE_URL + '/v1/predict2/voting', JSON.stringify(votingDto),{
            headers: {
                'Content-Type': 'application/json' ,
                'x-wi-token': token,
                'x-user-id': __ENV.TENANT
            }
        });

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
        _k.sleep(2);
    }

};