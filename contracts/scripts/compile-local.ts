/**
 * Compiles TenderEscrow.sol using the `solc` npm package (pure WASM build,
 * bundled with the npm install — no runtime download) instead of Hardhat's
 * default compiler downloader, which fetches native binaries from
 * binaries.soliditylang.org. That host is blocked by this environment's
 * network egress policy, so `hardhat compile` / `hardhat test` cannot run
 * here. This script produces the same ABI + bytecode Hardhat would, so the
 * contract logic can still be exercised locally. Run `hardhat test` instead
 * in an environment with unrestricted network access — it will download the
 * matching native compiler and use the same source.
 */
import fs from "fs";
import path from "path";
import solc from "solc";

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts");
const NODE_MODULES = path.join(__dirname, "..", "node_modules");
const OUT_DIR = path.join(__dirname, "..", "artifacts-local");

function findImport(importPath: string): { contents: string } | { error: string } {
  try {
    const resolved = importPath.startsWith(".")
      ? path.join(CONTRACTS_DIR, importPath)
      : path.join(NODE_MODULES, importPath);
    return { contents: fs.readFileSync(resolved, "utf8") };
  } catch {
    return { error: `File not found: ${importPath}` };
  }
}

function compile() {
  const source = fs.readFileSync(path.join(CONTRACTS_DIR, "TenderEscrow.sol"), "utf8");

  const input = {
    language: "Solidity",
    sources: { "TenderEscrow.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));

  const errors = (output.errors ?? []).filter((e: any) => e.severity === "error");
  if (errors.length > 0) {
    for (const e of errors) console.error(e.formattedMessage);
    throw new Error("Compilation failed.");
  }
  for (const w of output.errors ?? []) console.warn(w.formattedMessage);

  const contract = output.contracts["TenderEscrow.sol"]["TenderEscrow"];
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "TenderEscrow.json"),
    JSON.stringify({ abi: contract.abi, bytecode: "0x" + contract.evm.bytecode.object }, null, 2)
  );
  console.log(`Compiled OK — wrote ${path.join(OUT_DIR, "TenderEscrow.json")}`);
  console.log(`ABI entries: ${contract.abi.length}, bytecode length: ${contract.evm.bytecode.object.length / 2} bytes`);

  // Also drop a Hardhat-shaped artifact so `hardhat test --no-compile` can
  // pick it up via ethers.getContractFactory without needing network access.
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts", "TenderEscrow.sol");
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactsDir, "TenderEscrow.json"),
    JSON.stringify(
      {
        _format: "hh-sol-artifact-1",
        contractName: "TenderEscrow",
        sourceName: "contracts/TenderEscrow.sol",
        abi: contract.abi,
        bytecode: "0x" + contract.evm.bytecode.object,
        deployedBytecode: "0x" + contract.evm.deployedBytecode.object,
        linkReferences: {},
        deployedLinkReferences: {},
      },
      null,
      2
    )
  );
  console.log(`Also wrote Hardhat artifact — run 'npx hardhat test --no-compile' to use it.`);
}

compile();
