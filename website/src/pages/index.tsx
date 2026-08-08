import type {ReactNode} from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'

import CodeSamples from '@site/src/components/CodeSamples'
import {DemoConfigProvider} from '@site/src/components/DemoConfig/DemoConfig'
import FeatureList from '@site/src/components/FeatureList'
import Hero from '@site/src/components/Hero'
import {DemoSyncProvider} from '@site/src/components/Phone/DemoSync'
import styles from './index.module.css'

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext()
  return (
    <Layout
      title={siteConfig.title}
      description="React Native real-time Speech Recognition powered by Nitro Modules">
      <DemoConfigProvider>
        <DemoSyncProvider>
          <main className={styles.stage}>
            <section className={styles.hero} aria-label="Interactive demo">
              <Hero className={styles.canvas} />
            </section>
            <section
              className={styles.features}
              data-features
              aria-label="Package features">
              <div className={styles.featuresGrid}>
                <CodeSamples />
                <FeatureList />
              </div>
            </section>
          </main>
        </DemoSyncProvider>
      </DemoConfigProvider>
    </Layout>
  )
}
