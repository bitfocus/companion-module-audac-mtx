const { InstanceBase, Regex, runEntrypoint, InstanceStatus, TCPHelper } = require('@companion-module/base')

class instance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.updateStatus(InstanceStatus.Disconnected)
	}

	async init(config, firstInit) {
		let self = this

		this.config = config

		self.initTcp()

		self.initActions()
		self.initFeedback()
		self.initPresets()
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
			self.updateStatus(InstanceStatus.BadConfig, msg)
			return
		}

		self.socket = new TCPHelper(self.config.host, self.config.port)

		self.updateStatus(InstanceStatus.Connecting)

		self.socket.on('status_change', (status, message) => {
			if (status === 'ok') {
				self.updateStatus(InstanceStatus.Ok)
				self.connected = true
			} else {
				self.updateStatus(InstanceStatus.UnknownWarning, message)
				self.connected = false
			}
		})

		self.socket.on('error', (err) => {
			self.updateStatus(InstanceStatus.ConnectionFailure, err)
			self.log('error', 'Network error: ' + err.message)
		})

		self.socket.on('connect', () => {
			self.updateStatus(InstanceStatus.Ok)
			self.log('debug', 'Connected')
		})

		self.socket.on('data', (data) => {
			console.log(data)
		})
	}

	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		this.log('debug', 'destroy')
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
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
				regex: Regex.IP,
			},
		]
	}

	async configUpdated(config) {
		this.config = config
		this.initTcp()
	}

	initActions() {
		let self = this
		let actions = {}

		actions['set_zone_volume'] = {
			name: 'Set Zone Volume',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				let volume = opt.volume
				self.sendCommand('SV' + zone + '|' + -1 * volume)
			},
		}

		actions['up_zone_volume'] = {
			name: 'Zone Volume +3dB',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				self.sendCommand('SVU' + zone + '|0')
			},
		}

		actions['down_zone_volume'] = {
			name: 'Zone Volume -3dB',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				self.sendCommand('SVD' + zone + '|0')
			},
		}

		actions['set_zone_input'] = {
			name: 'Set Zone Input',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				let input = opt.input
				self.sendCommand('SR' + zone + '|' + input)
			},
		}

		actions['up_zone_input'] = {
			name: 'Zone Next Input',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				self.sendCommand('SRUO' + zone + '|0')
			},
		}

		actions['down_zone_input'] = {
			name: 'Zone Previous Input',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				self.sendCommand('SRDO' + zone + '|0')
			},
		}

		actions['set_zone_bass'] = {
			name: 'Set Zone Bass',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				let volume = opt.volume
				self.sendCommand('SBO' + zone + '|' + Math.round(volume / 2 + 7))
			},
		}

		actions['set_zone_treble'] = {
			name: 'Set Zone Treble',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				let volume = opt.volume
				self.sendCommand('STO' + zone + '|' + Math.round(volume / 2 + 7))
			},
		}

		actions['set_zone_mute'] = {
			name: 'Set Zone Mute Status',
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
			callback: (event) => {
				let opt = event.options
				let zone = opt.zone
				let mute = opt.mute
				self.sendCommand('SM0' + zone + '|' + mute)
			},
		}

		actions['save'] = {
			name: 'Save settings',
			options: [],
			callback: (event) => {
				self.sendCommand('SAVE|0')
			},
		}

		actions['factory_reset'] = {
			name: 'Factory Reset',
			options: [],
			callback: (event) => {
				self.sendCommand('DEF|0')
			},
		}

		this.setActionDefinitions(actions)
	}

	initFeedback() {
		let feedbacks = {}

		//Volume all or single
		//routing all or single
		//mute all or single
		//bass single
		//treble single
		//all info single
		//firmware

		this.setFeedbackDefinitions(feedbacks)
	}

	initVariables() {
		let variables = []

		this.setVariableDefinitions(variables)
	}

	initPresets() {
		let presets = {}

		this.setPresetDefinitions(presets)
	}

	updateVariables(data, patch) {
		let self = this
	}

	sendCommand(data) {
		let sendBuf = Buffer.from('#|X001|web|' + data + '|U|\r\n', 'latin1')

		if (sendBuf.length > 0) {
			this.log('debug', 'sending ' + sendBuf + ' to: ' + this.config.host)

			if (this.socket !== undefined && this.connected) {
				this.socket.send(sendBuf)
			} else {
				this.log('error', 'Socket not connected :(')
			}
		}
	}
}

runEntrypoint(instance, [])
