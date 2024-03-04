const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const {v4: uuidV4} = require('uuid')

app.set('view engine', 'ejs')
// 前端静态资源根目录
app.use(express.static('public'))

// 重定向至新的 roomId 页面
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  // 通过 req.params 获取动态路由参数
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  // 注册并监听客户端触发的 join-room 事件
  socket.on('join-room', (roomId, userId) => {
    // 让 socket 客户端加入这个 roomId 房间
    socket.join(roomId)
    // 让 socket 客户端向房间内（除自己之外）的其他客户端广播 user-connected 事件
    socket.to(roomId).emit('user-connected', userId)

    // 注册断开连接事件
    socket.on('disconnect', () => {
      // 向房间内其他成员广播 该用户断开连接
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(3000)