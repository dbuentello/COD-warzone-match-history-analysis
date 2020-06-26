const log4js = require('log4js');
log4js.configure({
	appenders: {
		stdout: { type: 'stdout' },
		dateFile: { type: 'dateFile', filename: '../../logs/application.log', pattern: '-yyyy-MM-dd.log' },
		stdoutFilter: { type: 'logLevelFilter', appender: 'stdout', level: 'ALL' },
		dateFileFilter: { type: 'logLevelFilter', appender: 'dateFile', level: 'INFO' },
	},
	categories: {
		default: { appenders: ['stdoutFilter', 'dateFileFilter'], level: 'DEBUG' },
		api: { appenders: ['stdoutFilter', 'dateFileFilter'], level: 'DEBUG' },
		main: { appenders: ['stdoutFilter', 'dateFileFilter'], level: 'DEBUG' },
	},
});

const apiLogger = log4js.getLogger('api');
const mainLogger = log4js.getLogger('main');

module.exports = {
	apiLogger,
	mainLogger,
};