const tcp = require('../../tcp')
const instance_skel = require('../../instance_skel')

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)
		let self = this

		self.initActions()
		self.initFeedback()
		self.initPresets()

		self.status(self.STATUS_UNKNOWN, '')
	}

	config_fields() {
		let self = this

		return [
			{
				type: 'text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module controls Audac MTX48/88 TCP commands on default port 5001.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: self.REGEX_IP,
			},
		]
	}

	init() {
		let self = this

		self.initTcp()
		self.initVariables()
	}

	initTcp() {
		let self = this

		if (self.socket !== undefined) {
			self.socket.destroy()
			delete self.socket
		}

		if (self.config.port === undefined) {
			self.config.port = 5001
		}

		// Check if the IP was set.
		if (self.config.host === undefined || self.config.host.length === 0) {
			let msg = 'IP is not set'
			self.log('error', msg)
			self.status(self.STATUS_WARNING, msg)
			return
		}

		if (self.config.host !== undefined) {
			self.socket = new tcp(self.config.host, self.config.port)

			self.status(self.STATE_WARNING, 'Connecting')

			self.socket.on('status_change', (status, message) => {
				self.status(status, message)
			})

			self.socket.on('error', (err) => {
				self.debug('Network error', err)
				self.status(self.STATE_ERROR, err)
				self.log('error', 'Network error: ' + err.message)
			})

			self.socket.on('connect', () => {
				self.status(self.STATE_OK)
				self.debug('Connected')
			})

			self.socket.on('data', (data) => {
				//console.log(data)
			})
		}
	}

	destroy() {
		let self = this

		if (self.socket !== undefined) {
			self.socket.destroy()
		}

		self.debug('destroy', self.id)
	}

	initActions() {
		let self = this
		let actions = {}

		actions['set_zone_volume'] = {
			label: 'Set Zone Volume',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
				{
					type: 'number',
					label: 'Volume',
					id: 'volume',
					min: -70,
					max: 0,
					default: 0,
					step: 1,
					required: true,
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				let volume = opt.volume
				self.sendCommand('SV' + zone + '|' + -1 * volume)
			},
		}

		actions['up_zone_volume'] = {
			label: 'Zone Volume +3dB',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				self.sendCommand('SVU' + zone + '|0')
			},
		}

		actions['down_zone_volume'] = {
			label: 'Zone Volume -3dB',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				self.sendCommand('SVD' + zone + '|0')
			},
		}

		actions['set_zone_input'] = {
			label: 'Set Zone Input',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '1',
					choices: [
						{ id: '1', label: 'Mic 1' },
						{ id: '2', label: 'Mic 2' },
						{ id: '3', label: 'Line 3' },
						{ id: '4', label: 'Line 4' },
						{ id: '5', label: 'Line 5' },
						{ id: '6', label: 'Line 6' },
						{ id: '7', label: 'WLI/MWX65' },
						{ id: '8', label: 'MMI' },
					],
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				let input = opt.input
				self.sendCommand('SR' + zone + '|' + input)
			},
		}

		actions['up_zone_input'] = {
			label: 'Zone Next Input',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				self.sendCommand('SRUO' + zone + '|0')
			},
		}

		actions['down_zone_input'] = {
			label: 'Zone Previous Input',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				self.sendCommand('SRDO' + zone + '|0')
			},
		}

		actions['set_zone_bass'] = {
			label: 'Set Zone Bass',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
				{
					type: 'number',
					label: 'Volume',
					id: 'volume',
					min: -14,
					max: +14,
					default: 0,
					step: 1,
					required: true,
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				let volume = opt.volume
				self.sendCommand('SBO' + zone + '|' + Math.round(volume / 2 + 7))
			},
		}

		actions['set_zone_treble'] = {
			label: 'Set Zone Treble',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
				{
					type: 'number',
					label: 'Volume',
					id: 'volume',
					min: -14,
					max: +14,
					default: 0,
					step: 1,
					required: true,
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				let volume = opt.volume
				self.sendCommand('STO' + zone + '|' + Math.round(volume / 2 + 7))
			},
		}

		actions['set_zone_mute'] = {
			label: 'Set Zone Mute Status',
			options: [
				{
					type: 'number',
					label: 'Zone',
					id: 'zone',
					min: 1,
					max: 8,
					default: 1,
					step: 1,
					required: true,
				},
				{
					type: 'dropdown',
					label: 'Status',
					id: 'mute',
					default: '1',
					choices: [
						{ id: '0', label: 'Unmute' },
						{ id: '1', label: 'Mute' },
					],
				},
			],
			callback: (action, bank) => {
				let opt = action.options
				let zone = opt.zone
				let mute = opt.mute
				self.sendCommand('SM0' + zone + '|' + mute)
			},
		}

		actions['save'] = {
			label: 'Save settings',
			options: [],
			callback: (action, bank) => {
				self.sendCommand('SAVE|0')
			},
		}

		actions['factory_reset'] = {
			label: 'Factory Reset',
			options: [],
			callback: (action, bank) => {
				self.sendCommand('DEF|0')
			},
		}

		self.setActions(actions)
	}

	initFeedback() {
		let self = this
		let feedbacks = {}

		//Volume all or single
		//routing all or single
		//mute all or single
		//bass single
		//treble single
		//all info single
		//firmware

		self.setFeedbackDefinitions(feedbacks)
	}

	initVariables() {
		let self = this

		let variables = []

		self.setVariableDefinitions(variables)
	}

	initPresets() {
		let self = this
		let presets = []

		self.setPresetDefinitions(presets)
	}

	updateConfig(config) {
		let self = this

		self.config = config

		self.initTcp()
	}

	updateVariables(data, patch) {
		let self = this
	}

	sendCommand(data) {
		let self = this

		let sendBuf = Buffer.from('#|X001|web|' + data + '|U|\r\n', 'latin1')

		if (sendBuf != '') {
			this.debug('sending ', sendBuf, 'to', this.config.host)

			if (this.socket !== undefined && this.socket.connected) {
				this.socket.send(sendBuf)
			} else {
				this.debug('Socket not connected :(')
			}
		}
	}
}

exports = module.exports = instance
