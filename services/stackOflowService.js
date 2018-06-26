const service = {};
const axios = require('axios');

service.getQuestion = function(questionText) {
    return axios
        .get('https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&q=' +
            encodeURIComponent(questionText) + '&site=stackoverflow&accepted=true')
        .then(function(res) {
            // Keep only three first question objects that are answered ( is_asnwered = true)
            const questions = res.data.items.filter(item => item.is_answered).slice(0, 3);
            if (!questions.length) return Promise.all([[], []]);
            // Save question id's in a string separated by semicolon
            const ids = questions.map(item => item.question_id).join(';');
            return Promise.all([
                questions,
                axios.get('https://api.stackexchange.com/2.2/questions/' + ids +
                    '/answers?order=desc&sort=votes&site=stackoverflow&filter=!9Z(-wzfpy')
            ])
        })
        .then(function([questions, answers]) {
            // For each question in questions, keep the object and add the key 'anwser' (spread syntax: '...')
            // The value for the new key will be the first answer that matchs with the question id and that is also accepted
            return questions
                .map(question => ({
                    ...question,
                    answer: answers.data.items
                        .find(a => a.question_id == question.question_id && a.is_accepted).body
                }));
        })
}

module.exports = service;
