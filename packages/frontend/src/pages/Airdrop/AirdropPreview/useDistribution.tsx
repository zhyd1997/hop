import React, { useState, useEffect } from 'react'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { commafy } from 'src/utils'

const distributionCsvUrl = 'https://raw.githubusercontent.com/hop-protocol/hop-airdrop/master/src/data/finalDistribution.csv'
const BASE_AMOUNT = BigNumber.from('306120584096350311603')

export function useDistribution(address?: string) {
  const [loading, setLoading] = useState<boolean>(false)
  const [allData, setAllData] = useState<any>(null)
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const update = async () => {
      try {
        setAccountInfo(null)
        if (!address) {
          return
        }
        const url = `https://airdrop-api.hop.exchange/v1/airdrop/${address}`
        const res = await fetch(url)
        const json = await res.json()
        if (json.status === 'ok') {
          setAccountInfo(json?.data)
        }
        if (json.error) {
          throw new Error(json.error)
        }
      } catch (err: any) {
        console.error(err)
      }
    }

    update().catch(console.error)
  }, [address])

  useEffect(() => {
    const update = async () => {
      try {
        setError('')
        if (allData) {
          return
        }
        setLoading(true)
        const res = await fetch(distributionCsvUrl)
        const text = await res.text()
        if (!text?.length || text?.includes('Not Found')) {
          throw new Error('Could not retrieve data. Refresh page and try again.')
        }
        const csv = text.trim().split('\n')
        const header = csv[0].split(',')
        const rows = csv.slice(1)
        const data :any = {}
        for (const line of rows) {
          const row = line.split(',')
          const address = row[0]?.toLowerCase()
          data[address] = {}
          for (const h of header) {
            data[address][h] = row[header.indexOf(h)]
          }
        }
        setAllData(data)
        setLoading(false)
      } catch (err: any) {
        console.error(err)
        if (err.message === 'Failed to fetch') {
          setError('Failed to fetch data. Please refresh page to try again.')
        } else {
          setError(err.message)
        }
      }
    }

    update().catch(console.error)
  }, [])

  let lpTokens = 0
  let hopUserTokens = 0
  let baseAmount = 0
  let earlyMultiplier = 0
  let volumeMultiplier = 0
  let total = 0
  const baseAmountBn = BASE_AMOUNT
  if (address) {
    const data = allData?.[address.toLowerCase()]
    if (data) {
      lpTokens = Number(formatUnits(data.lpTokens.toString(), 18))
      hopUserTokens = Number(formatUnits(data.hopUserTokens.toString(), 18))
      earlyMultiplier = Number(Number(data.earlyMultiplier).toFixed(4)) || 1
      volumeMultiplier = Number(Number(data.volumeMultiplier).toFixed(4)) || 1
      if (hopUserTokens) {
        baseAmount = Number(formatUnits(baseAmountBn.toString(), 18))
      }
      if (data.totalTokens) {
        total = Number(formatUnits(data.totalTokens.toString(), 18))
      } else {
        total = (lpTokens + hopUserTokens)
      }
    }
  }

  const lpTokensFormatted = lpTokens > 0 ? commafy(lpTokens, 4) : lpTokens
  const hopUserTokensFormatted = hopUserTokens > 0 ? commafy(hopUserTokens, 4) : hopUserTokens
  const baseAmountFormatted = baseAmount > 0 ? commafy(baseAmount, 4) : baseAmount
  const earlyMultiplierFormatted = earlyMultiplier > 0 ? `x${earlyMultiplier.toFixed(4)}` : earlyMultiplier
  const volumeMultiplierFormatted = volumeMultiplier > 0 ? `x${volumeMultiplier.toFixed(4)}` : volumeMultiplier
  const totalFormatted = total > 0 ? commafy(total, 4) : total
  let isBot: any = null
  let numTxs : any = null
  let addressVolume :any = null
  if (accountInfo) {
    isBot = accountInfo?.isBot ?? false
    numTxs = Number(accountInfo?.totalTxs)
    addressVolume = Number(accountInfo?.totalVolume)
  }
  const addressVolumeFormatted = addressVolume > 0 ? `$${commafy(addressVolume, 4)}` : '0'

  return {
    error,
    loading,
    lpTokens,
    lpTokensFormatted,
    hopUserTokens,
    hopUserTokensFormatted,
    baseAmount,
    baseAmountFormatted,
    earlyMultiplier,
    earlyMultiplierFormatted,
    volumeMultiplier,
    volumeMultiplierFormatted,
    total,
    totalFormatted,
    isBot,
    numTxs,
    addressVolume,
    addressVolumeFormatted
  }
}
