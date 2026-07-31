import type { ReactNode } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'

import WaveShader from '@site/src/components/WaveShader'
import styles from './index.module.css'

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title={siteConfig.title}
      description="React Native real-time Speech Recognition powered by Nitro Modules"
    >
      <main className={styles.stage}>
        <WaveShader className={styles.canvas} />
      </main>
    </Layout>
  )
}
