import { calculateCoverage } from './coverage.js'
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ key: data.key, result: calculateCoverage(JSON.parse(data.key)) })
  } catch {
    self.postMessage({ key: data.key, error: true })
  }
}
