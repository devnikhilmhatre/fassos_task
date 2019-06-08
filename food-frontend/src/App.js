import React, { Component } from 'react';
import './App.css';
import socket from './socket'
import { ResponsiveBar } from '@nivo/bar'
import { CSVLink } from "react-csv";

class App extends Component {

	constructor(props) {
		super(props);
		this.state = {
			orderData: [],
			customerData: [],
			filter: 'Month',
			user: 'Select',
			userList: [],
			userData: [],
			status: 'Not Delivered',
			formUser: 'Select',
			currentOrder: null
		}
	}

	componentWillMount = () => {
		socket.emit('get-data', this.state.filter)
		socket.emit('get-user-list')

	}

	componentDidMount = () => {

		socket.on('order-data', (data) => {
			this.setState({
				orderData: data
			})
		})

		socket.on('user-list', (data) => {
			this.setState({
				userList: data
			})
		})

		socket.on('user-data', (data) => {
			this.setState({
				userData: data
			})
		})

		socket.on('order-added', (newData) => {
			const stateData = this.state.orderData
			let data = []
			stateData.forEach(item => {

				if (item.Month === newData.month) {
					item['Not Delivered'] = item['Not Delivered'] + 1
					data.push(item)
				} else {
					data.push(item)
				}

			})

			this.setState({
				orderData: data,
				currentOrder: newData.order
			})
		})

		socket.on('updated-data', (newData) => {
			const stateData = this.state.orderData
			let data = []

			stateData.forEach(item => {

				if (item.Month === newData.month) {
					debugger
					item[newData.oldStatus] = item[newData.oldStatus] - 1
					item[newData.newStatus] = item[newData.newStatus] + 1
					data.push(item)
				} else {
					data.push(item)
				}

			})

			this.setState({
				orderData: data
			})
		})
	}

	_onChange = (e, id) => {
		if (e.target.name === 'filter') {
			socket.emit('get-data', e.target.value)
		} else if (e.target.name === 'user') {
			socket.emit('get-user-data', e.target.value)
		} else if (e.target.name === 'status') {
			socket.emit('update-status', { id, status: e.target.value, currentState: this.state.status })
		} else {
			socket.emit('add-order', e.target.value)
		}

		this.setState({
			[e.target.name]: e.target.value
		})
	}


	_csvData = (data) => {

		let csvData = []

		data.forEach(item => {
			delete item['DeliveredColor']
			delete item['Not DeliveredColor']
			delete item['CancelledColor']

			csvData.push(item)
		})

		return csvData
	}

	render() {



		return (
			<React.Fragment>


				<div style={{ padding: 5 }}>

					<h4>Select a user to place an order</h4>

					<select name="formUser" value={this.state.formUser}
						style={{ margin: '0px 15px' }}
						onChange={this._onChange}>
						<option value="Select">Place Order</option>
						{this.state.userList.map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
					</select>

					{
						this.state.currentOrder !== null &&
						<select name="status" value={this.state.status}
							style={{ margin: '0px 15px' }}
							onChange={(e) => this._onChange(e, this.state.currentOrder._id)}>
							<option value="Not Delivered">Not Delivered</option>
							<option value="Delivered">Delivered</option>
							<option value="Cancelled">Cancelled</option>
						</select>
					}

					<CSVLink style={{ margin: '0px 15px', float: 'right' }} data={this._csvData(this.state.userData)}>User's order data Download as CSV</CSVLink>
					<CSVLink style={{ margin: '0px 15px', float: 'right' }} data={this._csvData(this.state.orderData)}>All order data Download as CSV</CSVLink>
				</div>

				<br />
				<br />
				<hr />


				{/* ---------------------------------------------------------------------- */}

				<div style={{ height: '70vh', width: '48%', padding: 5, float: 'left' }}>

					<select name="filter" value={this.state.filter} onChange={this._onChange}>
						<option value="Month">Months</option>
						<option value="Day">Days</option>
						<option value="Hour">Hours</option>
					</select>

					<BarGraph data={this.state.orderData} indexBy={this.state.filter} />
				</div>


				{/* ---------------------------------------------------------------------- */}

				<div style={{ height: '70vh', width: '48%', padding: 5, float: 'left' }}>

					<select name="user" value={this.state.user} onChange={this._onChange}>
						<option value="Select">Select User</option>
						{this.state.userList.map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
					</select>

					{
						this.state.user !== 'Select' &&
						<BarGraph data={this.state.userData} indexBy='Month' />
					}
				</div>



			</React.Fragment>


		);
	}
}

export default App;




const BarGraph = (props) => {
	return (
		<ResponsiveBar
			data={props.data}
			keys={[
				"Delivered",
				"Not Delivered",
				"Cancelled",
			]}
			indexBy={props.indexBy}
			margin={{
				"top": 50,
				"right": 130,
				"bottom": 50,
				"left": 60
			}}
			padding={0.3}
			colors="nivo"
			colorBy="id"
			defs={[
				{
					"id": "dots",
					"type": "patternDots",
					"background": "inherit",
					"color": "#38bcb2",
					"size": 4,
					"padding": 1,
					"stagger": true
				},
				{
					"id": "lines",
					"type": "patternLines",
					"background": "inherit",
					"color": "#eed312",
					"rotation": -45,
					"lineWidth": 6,
					"spacing": 10
				}
			]}
			fill={[
				{
					"match": {
						"id": "fries"
					},
					"id": "dots"
				},
				{
					"match": {
						"id": "Cancelled"
					},
					"id": "lines"
				}
			]}
			borderColor="inherit:darker(1.6)"
			axisTop={null}
			axisRight={null}
			axisBottom={{
				"tickSize": 5,
				"tickPadding": 5,
				"tickRotation": 0,
				"legend": props.indexBy,
				"legendPosition": "middle",
				"legendOffset": 32
			}}
			axisLeft={{
				"tickSize": 5,
				"tickPadding": 5,
				"tickRotation": 0,
				"legend": "Number",
				"legendPosition": "middle",
				"legendOffset": -40
			}}
			labelSkipWidth={12}
			labelSkipHeight={12}
			labelTextColor="inherit:darker(1.6)"
			animate={true}
			motionStiffness={90}
			motionDamping={15}
			legends={[
				{
					"dataFrom": "keys",
					"anchor": "bottom-right",
					"direction": "column",
					"justify": false,
					"translateX": 120,
					"translateY": 0,
					"itemsSpacing": 2,
					"itemWidth": 100,
					"itemHeight": 20,
					"itemDirection": "left-to-right",
					"itemOpacity": 0.85,
					"symbolSize": 20,
					"effects": [
						{
							"on": "hover",
							"style": {
								"itemOpacity": 1
							}
						}
					]
				}
			]}
		/>
	)
}
