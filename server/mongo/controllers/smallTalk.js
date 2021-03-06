const SmallTalkSchema = require('../schemas/smallTalkSchema');
const debug = require('debug')('smallTalk');

// eslint-disable-next-line no-unused-vars
function getSTEnabled(req, res) {
  SmallTalkSchema.find({ 'options.enabled': true }, (err, model) => {
    if (err) {
      debug(err);
      res.sendStatus(500);
    } else if (model.length > 0) {
      const tempModel = model[0].toObject();

      const temp = [];
      tempModel.smallTalk.forEach(st => {
        st.training.forEach(stTraining => {
          temp.push({
            intent: tempModel.options.prefix + st.name,
            text: stTraining,
            entities: [],
          });
        });
      });
      res.send(temp);
    } else {
      res.send(false);
    }
  });
}

function getST(req, res) {
  const { name } = req.params;
  SmallTalkSchema.findOne({ name })
    .then(model => {
      if (!model) {
        const y = new SmallTalkSchema({
          name,
        });
        y.save().then(() => {
          res.send(y);
        });
      } else {
        res.send(model);
      }
    })
    .catch(() => {
      res.sendStatus(500);
    });
}

function upsertST(req, res) {
  const { name } = req.params;
  SmallTalkSchema.findOneAndUpdate({ name }, req.body)
    .then(() => {
      generateServiceSideUsage();
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
}

function generateServiceSideUsage() {
  return new Promise(resolve => {
    SmallTalkSchema.find({}, (err, model) => {
      if (model.length > 0) {
        const st = model[0].toObject();

        const temp = {};

        st.smallTalk.forEach(i => {
          temp[st.options.prefix + i.name] = i.responses;
        });

        temp.enabled = st.options.enabled;
        resolve(`Small Talk: ${Object.keys(temp).length} Items`);
      } else {
        resolve('No small talk to set.');
      }
    });
  });
}

module.exports = {
  getST,
  upsertST,
  generateServiceSideUsage,
};
