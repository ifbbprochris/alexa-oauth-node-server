const express = require('express');
const router = express.Router();
const axios = require('axios');
const myRedis = require('../myRedis');
const contryCodeList = require('./countryCodeList');

const YOUR_LOGIN_API_URL = '';

/* GET home page. default alexa login */
router.route('/login')
  .get(function (req, res) {
    res.render('login', { title: 'User Login', contryCodeList: contryCodeList });
  })
  .post(function (req, res) {
    if (!req.body.countrycode) return
    if (!req.body.username) return
    if (!req.body.password) return

    /** 这里根据 req.query 获取你需要的 Alexa skill 参数， 这里我只需要这两个， 主要的是 redirect_uri，验证成功之后的跳转地址*/
    let state = req.query.state
    let redirect_uri = req.query.redirect_uri

    const body = { country_code: req.body.countrycode, username: req.body.username, password: req.body.password }
    axios.post(YOUR_LOGIN_API_URL, body)
      .then(function (response) {
        const { code, msg, data } = response.data
        if (code == 200) {
          let randomCode = generateRandomAlphaNum(18);
          let redisValue = req.body.countrycode + '-' + req.body.username + '-' + req.body.password;
          myRedis.setCode(randomCode, redisValue)
          let url = `${redirect_uri}?code=${randomCode}&state=${state}`;
        
          /** 走到这一步成功就跳转 */
          res.redirect(url)
        } else {
          res.render('error', { message: msg, title: 'Error page' })
        }
      })
      .catch(function (error) {
        res.render('error', { message: error, title: 'Error page' })
      });
  });

/* 这个是百度的 dueros login route, 逻辑和 alexa 是一样的 */
router.route('/dueros_login')
  .get(function (req, res) {
    res.render('dueros_login', { title: '用户登陆授权', contryCodeList: contryCodeList });
  })
  .post(function (req, res) {
    if (!req.body.username) return
    if (!req.body.password) return
    let state = req.query.state
    let redirect_uri = req.query.redirect_uri

    const body = { country_code: '+86', username: req.body.username, password: req.body.password }
    axios.post(YOUR_LOGIN_API_URL, body)
      .then(function (response) {
        const { code, msg, data } = response.data
        console.log(code, msg, data)
        if (code == 200) {
          let randomCode = generateRandomAlphaNum(18)
          let redisValue = '+86' + '-' + req.body.username + '-' + req.body.password;
          myRedis.setCode(randomCode, redisValue)
          let url = `${redirect_uri}?code=${randomCode}&state=${state}`;
          res.redirect(url)
        } else {
          res.render('error', { message: msg, title: '错误页面' })
        }
      })
      .catch(function (error) {
        res.render('error', { message: error, title: '错误页面' })
      });
  });

/* 这是里 Alexa 的请求token的路由 alexa route get token */
router.route('/token')
  .post(function (req, res) {
    console.log('body:', JSON.stringify(req.body))
    var code = req.body.code;
    console.log('code from alexa service:', code);
    myRedis.getToken(code, function (error, reply) {
      console.log('reply from redis:', reply);
      if (reply != null) {

        let arr = reply.split('-');
        const body = { country_code: arr[0], username: arr[1], password: arr[2] }
        //use the refresh_token to refresh the redis key 
        axios.post(YOUR_LOGIN_API_URL, body).then(function (response) {
          const { code, msg, data } = response.data
          console.log('code from aeris /login api:', code);
          if (code === 200) {
            const { access_token } = data;
            console.log('access_token:', access_token);

            /** 走到这里返回 access_token， refresh_token 看你需要 */
            res.json({ "access_token": access_token, "refresh_token": "REFRESH_TOKEN" });
          } else {
            console.log('alexa post response is not 200');
            res.render('error', { message: 'Get token error', title: 'Error page' })
          }
        }).catch(function (error) {
          console.log('api login post to get the accessToken error');
          res.render('error', { message: 'Get token error', title: 'Error page' })
        });
      } else {
        console.log('reply from redis error');
        res.render('error', { message: 'Get token error', title: 'Error page' })
      }
    })
  })

/* 这里是百度的， 逻辑都是一样的 dueros route get token */
router.route('/dueros_token')
  .get(function (req, res) {
    var code = req.query.code;
    console.log('code from dueros service:', code);
    myRedis.getToken(code, function (error, reply) {
      console.log('reply from redis:', reply);
      if (reply != null) {
        let arr = reply.split('-');
        const body = { country_code: arr[0], username: arr[1], password: arr[2] }
        //use the refresh_token to refresh the redis key 
        axios.post(YOUR_LOGIN_API_URL, body).then(function (response) {
          const { code, msg, data } = response.data
          console.log('code from aeris /dueros_login api:', code);
          if (code === 200) {
            const { access_token } = data;
            console.log('access_token:', access_token);
            res.json({ "access_token": access_token, "refresh_token": "REFRESH_TOKEN" });
          } else {
            console.log('alexa post response is not 200');
            res.render('error', { message: '获取 token 出错', title: 'Error page' })
          }
        }).catch(function (error) {
          console.log('api /dueros_login post to get the accessToken error');
          res.render('error', { message: '获取 token 出错', title: 'Error page' })
        });
      } else {
        console.log('reply from redis error');
        res.render('error', { message: '获取 token 出错', title: 'Error page' })
      }
    })
  })

function generateRandomAlphaNum(len) {
  var rdmString = "";
  //toSting接受的参数表示进制，默认为10进制。36进制为0-9 a-z
  for (; rdmString.length < len; rdmString += Math.random().toString(36).substr(2));
  return rdmString.substr(0, len);
}

module.exports = router;