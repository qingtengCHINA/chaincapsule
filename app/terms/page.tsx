import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Terms of Service — ChainCapsule',
}

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#060608]">
      <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20 py-12 pt-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2" style={{ fontFamily: 'var(--font-en)' }}>
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-600 mb-8">Last updated: May 4, 2026</p>

        <div className="prose prose-invert prose-zinc max-w-none text-zinc-400 leading-relaxed space-y-6 text-sm">
          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ChainCapsule (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service. ChainCapsule is a decentralized application (dApp)
              deployed on the BNB Smart Chain blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">2. Description of Service</h2>
            <p>
              ChainCapsule allows users to create time-locked digital capsules on the BNB Smart Chain blockchain.
              Users may attach text content (stored on IPFS via Pinata) and optionally deposit BNB tokens
              into capsules. Capsules can be opened after a specified block number is reached.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">3. Wallet Connection</h2>
            <p>
              The Service requires a compatible Web3 wallet (such as MetaMask or Binance Wallet) to interact
              with the blockchain. You are solely responsible for the security of your wallet, private keys,
              and seed phrases. ChainCapsule never has access to your private keys.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">4. Blockchain Transactions</h2>
            <p>
              All capsule creation, opening, and BNB withdrawal operations are blockchain transactions.
              Once confirmed on-chain, transactions are irreversible. You are responsible for paying
              gas fees associated with each transaction. ChainCapsule cannot reverse, cancel, or modify
              any confirmed blockchain transaction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">5. BNB Deposits and Withdrawals</h2>
            <p>
              Users may optionally deposit BNB into capsules. Deposited BNB is held by the smart contract
              on the BNB Smart Chain. BNB can be withdrawn by the capsule creator or designated recipient
              after the capsule is opened. If a capsule remains unopened for approximately 365 days after
              its unlock block, the creator may reclaim the deposited BNB. ChainCapsule does not custody
              or control any user funds.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">6. Content Responsibility</h2>
            <p>
              You are solely responsible for the content you store in capsules. Content is stored on IPFS,
              a decentralized storage network, and referenced by a content identifier (CID) on-chain.
              Do not store illegal, harmful, or infringing content. ChainCapsule reserves the right to
              moderate public capsule content displayed on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">7. Smart Contract Risks</h2>
            <p>
              The Service relies on smart contracts deployed on the BNB Smart Chain. While designed with
              security best practices (including OpenZeppelin&apos;s ReentrancyGuard and Pausable patterns),
              smart contracts may contain bugs or vulnerabilities. Use the Service at your own risk.
              ChainCapsule is not liable for any loss of funds due to smart contract vulnerabilities,
              blockchain network issues, or unforeseen circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">8. No Warranty</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              ChainCapsule does not guarantee uninterrupted or error-free operation. We are not responsible
              for any damages arising from the use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">9. Limitation of Liability</h2>
            <p>
              In no event shall ChainCapsule, its developers, or affiliates be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of funds, data,
              or profits, arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">10. Open Source</h2>
            <p>
              ChainCapsule is an open-source project. The source code is publicly available on GitHub.
              The smart contracts are verified on BSCScan. Transparency and security are core principles
              of this project.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted on this page
              with an updated revision date. Continued use of the Service after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-200 mt-8 mb-3">12. Contact</h2>
            <p>
              For questions about these Terms, visit{' '}
              <a href="https://qingtengstudio.com" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-zinc-100 underline">
                qingtengstudio.com
              </a>{' '}
              or open an issue on our{' '}
              <a href="https://github.com/qingtengCHINA/chaincapsule" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-zinc-100 underline">
                GitHub repository
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
