var users = require('./models/user_model')
var orders = require('./models/order_model')
var ObjectID = require('mongodb').ObjectID;

const months = {
    1: 'Jan',
    2: 'Feb',
    3: 'Mar',
    4: 'Apr',
    5: 'May',
    6: 'Jun',
    7: 'Jul',
    8: 'Aug',
    9: 'Sep',
    10: 'Oct',
    11: 'Nov',
    12: 'Dec'
}

module.exports = function (socket_instance) {

    socket_instance.on('get-data', function (type) {

        let query = undefined

        if (type == 'Month') {
            query = orders.aggregate([
                {
                    $group: {
                        _id: { status: "$status", Month: { $month: '$created' } },
                        value: { $sum: 1 }
                    }
                },

            ])
        } else if (type == 'Day') {
            query = orders.aggregate([
                {
                    $group: {
                        _id: { status: "$status", Day: { $dayOfMonth: '$created' } },
                        value: { $sum: 1 }
                    }
                },

            ])
        }
        else {
            query = orders.aggregate([
                {
                    $group: {
                        _id: { status: "$status", Hour: { $hour: '$created' } },
                        value: { $sum: 1 }
                    }
                },

            ])
        }


        query.exec(function (err, data) {

            let arr = generateArray(data, type)

            socket_instance.emit('order-data', arr)
        })
    })


    socket_instance.on('get-user-list', function () {
        users.find({}, function (err, data) {
            socket_instance.emit('user-list', data)
        })
    })

    socket_instance.on('get-user-data', function (id) {
        orders.aggregate([
            {
                $match: {
                    user_id: ObjectID(id)
                }
            },
            {
                $group: {
                    _id: { status: "$status", Month: { $month: '$created' } },
                    value: { $sum: 1 }
                }
            },

        ]).exec(function (err, data) {
            // console.log(err, data)
            let arr = generateArray(data, 'Month')
            socket_instance.emit('user-data', arr)
        })
    })



    socket_instance.on('add-order', function (id) {
        let order = new orders({
            user_id: ObjectID(id)
        })

        order.save(function (err, data) {
            socket_instance.emit('order-added', {
                month: months[data.created.getMonth() + 1],
                order: data
            })
        })
    })


    socket_instance.on('update-status', function (recData) {
        orders.findByIdAndUpdate(recData.id,
            { status: recData.status },
            { new: true }, function (err, data) {

                socket_instance.emit('updated-data', {
                    month: months[data.created.getMonth() + 1],
                    newStatus: recData.status,
                    oldStatus: recData.currentState
                })
            })
    })


    function generateArray(data, type) {
        let arr = {}

        data.forEach(item => {
            let temp = {}

            if (arr[item['_id'][type]] == undefined) {
                temp = {
                    "Delivered": 0,
                    "DeliveredColor": "hsl(307, 70%, 50%)",
                    "Not Delivered": 0,
                    "Not DeliveredColor": "hsl(76, 70%, 50%)",
                    "Cancelled": 0,
                    "CancelledColor": "hsl(45, 70%, 50%)",
                }
            } else {
                temp = arr[item['_id'][type]]
            }



            temp[type] = type == 'Month' ? months[item._id[type]] : item._id[type].toString()

            let status = item['_id']['status']

            if (status === 'Not Delivered') { temp['Not Delivered'] = item.value }
            else if (status === 'Delivered') { temp['Delivered'] = item.value }
            else { temp['Cancelled'] = item.value }

            arr[item['_id'][type]] = temp

        })

        tempArr = []
        Object.keys(arr).sort(function (a, b) { return a - b }).forEach(function (key) {
            tempArr.push(arr[key])
        })

        return tempArr
    }

}