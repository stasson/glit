import fs from 'fs-extra'
import yaml from 'js-yaml'
import JoyCon from 'joycon'

const config = new JoyCon({
  files: ['.glitrc', '.glitrc.json', '.glitrc.yml', '.glitrc.yaml', '.glitrc.js'],
  packageKey: 'glit',
}).addLoader({
  test: /\.(yml|yaml)$/,
  async load(filepath) {
    const cfg = await fs.readFile(filepath, 'utf8')
    return yaml.load(cfg)
  }})

export async function loadConfig() {
  const { data } = await config.load()
  return data || {}
} 

export default loadConfig