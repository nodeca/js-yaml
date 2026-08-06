import * as jsyaml from '../../src/index.ts'
import codemirror from 'codemirror'
import { inspect } from 'util'
import defaultText from './sample.mjs'

import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/mode/javascript/javascript.js'
import './demo.css'

let source
let result
let permalink
let clear

function encodeBase64 (str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)))
}

function decodeBase64 (str) {
  return new TextDecoder().decode(Uint8Array.from(atob(str), (char) => {
    return char.charCodeAt(0)
  }))
}

const SexyYamlTag = jsyaml.defineSequenceTag('!sexy', {
  create: () => [],
  addItem: (container, item) => { container.push(`sexy ${item}`) },
  identify: () => false
})

const SEXY_SCHEMA = jsyaml.YAML11_SCHEMA.withTags(SexyYamlTag)

function parse () {
  let obj

  const str = source.getValue()
  permalink.href = `#yaml=${encodeBase64(str)}`

  try {
    obj = jsyaml.load(str, { schema: SEXY_SCHEMA })

    result.setOption('mode', 'javascript')
    result.setValue(inspect(obj, false, 10))
  } catch (err) {
    result.setOption('mode', 'text/plain')
    result.setValue(err.message || String(err))
  }
}

function updateSource () {
  let yaml

  if (location.hash && location.hash.toString().slice(0, 6) === '#yaml=') {
    yaml = decodeBase64(location.hash.slice(6))
  }

  source.setValue(yaml || defaultText)
  parse()
}

window.onload = () => {
  permalink = document.getElementById('permalink')
  clear = document.getElementById('clear')

  source = codemirror.fromTextArea(document.getElementById('source'), {
    mode: 'yaml',
    lineNumbers: true
  })

  let timer

  source.on('change', () => {
    clearTimeout(timer)
    timer = setTimeout(parse, 500)
  })

  result = codemirror.fromTextArea(document.getElementById('result'), {
    readOnly: true
  })

  clear.addEventListener('click', (event) => {
    event.preventDefault()
    source.setValue('')
    parse()
  })

  // initial source
  updateSource()
}
