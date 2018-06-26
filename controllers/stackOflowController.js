const self = {};
const stackOflowService = require('../services/stackOflowService');

// Promise based HTTP client for the browser and node.js
const axios = require('axios');
// Unescape html entities in string. See: https://www.npmjs.com/package/html-entities
const Entities = require('html-entities').XmlEntities;
// Converts HTML to Markdowns in Slack flavor. See demo here: http://domchristie.github.io/turndown/
const TurndownService = require('turndown');

const entities = new Entities();
const turndownService = new TurndownService({codeBlockStyle: 'fenced', strongDelimiter: '*'});
turndownService.addRule('links', {
    // Remove links (only aesthetic use)
    filter: ['a'],
    replacement: (content, node) => node.getAttribute('href')
});

self.getQuestions = function(req, res) {
    // "req.body.text" is the input text inserted by de user after /stackoverflow
    stackOflowService.getQuestion(req.body.text)
    .then(function(questions) {
        const colors = ["#c72653","#53C726", "#2653C7"]
        if (questions.length) {
            let data = {
                response_type: 'ephemeral', // public to the channel. If use 'ephemeral' only will be visible to the user.
                text: 'Encontré esto:', // Optional text
                attachments: questions.map((question, index) => ({
                    color: colors[index],
                    callback_id: question.question_id,
                    title: entities.decode(question.title),
                    title_link: question.link,
                    fields: [{
                        title: "Accepted Answer:",
                        value: turndownService.turndown(question.answer)
                            // Remove double newlines
                            .split('\n\n').join('\n')

                    }],
                    mrkdwn_in: ["fields"],
                        actions: [{
                        name: req.body.text,
                        text: "Compartir al canal!",
                        type: "button",
                        value: JSON.stringify(question)
                    }],
                    footer: "Stack Overflow",
                    ts: question.last_activity_date
                }))
            };
            res.json(data);
        } else{
            res.json({text: `Lo siento, no encontré nada! Probá modificar tu pregunta o buscá en google: https://www.google.com/search?q=${encodeURIComponent(req.body.text)}+site:stackoverflow.com`})
        }
    })
    .catch(function(err) {
        res.send(err.message);
    })
};

self.getAnswer = function(req, res, next) {
    const payload = JSON.parse(req.body.payload);
    const question = JSON.parse(payload.actions[0].value);
    const data = {
        response_type: 'in_channel', // public to the channel. If use 'ephemeral' only will be visible to the user.
        text: `<@${payload.user.id}>:\n> /stackoverflow ${payload.actions[0].name}`, // Optional text
        replace_original: false,
        attachments: [{
            color: "#c72653",
            callback_id: question.question_id,
            title: entities.decode(question.title),
            title_link: question.link,
            fields: [{
                title: "Accepted Answer:",
                value: turndownService.turndown(entities.decode(question.answer))
                    // Remove double newlines
                    .split('\n\n').join('\n')
            }],
            mrkdwn_in: ["fields"],
            footer: "Stack Overflow",
            ts: question.last_activity_date
        }]
    };
    axios.post(payload.response_url, data);
    res.json({text: 'Respuesta enviada al canal!'});
}

module.exports = self;
