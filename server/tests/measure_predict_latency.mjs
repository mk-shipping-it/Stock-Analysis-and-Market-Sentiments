import http from 'http';
import { performance } from 'perf_hooks';

const PORT = 5001;

function callPredict() {
  const body = JSON.stringify({ symbol: 'AAPL' });
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/api/predict',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          elapsed: 0,
          body: data.length > 200 ? data.slice(0, 200) + '...' : data,
        });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function measureSerial() {
  const start = performance.now();
  const r1 = await callPredict();
  const mid = performance.now();
  const r2 = await callPredict();
  const end = performance.now();
  return {
    call1: { status: r1.status, elapsed: mid - start },
    call2: { status: r2.status, elapsed: end - mid },
    total: end - start,
  };
}

async function measureParallel() {
  const start = performance.now();
  const [r1, r2] = await Promise.all([callPredict(), callPredict()]);
  const end = performance.now();
  return {
    call1: { status: r1.status },
    call2: { status: r2.status },
    total: end - start,
  };
}

async function main() {
  console.log('=== POST /api/predict Serial vs Parallel Latency ===\n');

  console.log('Serial (one after another):');
  const serialResult = await measureSerial();
  console.log(`  Call 1: ${serialResult.call1.elapsed.toFixed(2)}ms (HTTP ${serialResult.call1.status})`);
  console.log(`  Call 2: ${serialResult.call2.elapsed.toFixed(2)}ms (HTTP ${serialResult.call2.status})`);
  console.log(`  Total:  ${serialResult.total.toFixed(2)}ms`);

  console.log('\nParallel (Promise.all):');
  const parallelResult = await measureParallel();
  console.log(`  Total:  ${parallelResult.total.toFixed(2)}ms`);
  console.log(`  Call 1: HTTP ${parallelResult.call1.status}`);
  console.log(`  Call 2: HTTP ${parallelResult.call2.status}`);

  console.log('\n=== Summary ===');
  console.log(`Serial total:   ${serialResult.total.toFixed(2)}ms`);
  console.log(`Parallel total: ${parallelResult.total.toFixed(2)}ms`);
  const savings = serialResult.total - parallelResult.total;
  console.log(`Time saved:     ${savings.toFixed(2)}ms (${((savings / serialResult.total) * 100).toFixed(1)}%)`);
}

main().catch(console.error);
