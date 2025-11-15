import log4js from 'log4js'

export interface LoggerOptions {
    storageDirPath: string
    /**
     * log4js 配置项
     * - 若为 pm2 运行程序, 请确保配置项中 pm2 为 true
     * - 文档 https://log4js-node.github.io/log4js-node/clustering.html
     */
    log4jsConfiguration?: log4js.Configuration
}