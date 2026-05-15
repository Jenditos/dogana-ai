import type { InvoiceItem, AsycudaPosition } from '@/types'

export function groupToAsycudaPositions(items: InvoiceItem[]): AsycudaPosition[] {
  const map = new Map<string, AsycudaPosition>()

  items.forEach(item => {
    const key = item.tariffCode || `NO_CODE_${item.id}`
    const existing = map.get(key)

    if (existing) {
      existing.totalQty += item.qty
      existing.totalValue += item.totalValue
      existing.grossWeight += item.grossWeight
      existing.netWeight += item.netWeight
      existing.packages += item.packages
      existing.descriptionEn += existing.descriptionEn.includes(item.descriptionEn)
        ? '' : ` / ${item.descriptionEn}`
      existing.descriptionSq += existing.descriptionSq.includes(item.descriptionSq)
        ? '' : ` / ${item.descriptionSq}`
    } else {
      map.set(key, {
        positionNo: 0,
        tariffCode: item.tariffCode,
        descriptionEn: item.descriptionEn,
        descriptionSq: item.descriptionSq,
        totalQty: item.qty,
        totalValue: item.totalValue,
        grossWeight: item.grossWeight,
        netWeight: item.netWeight,
        packages: item.packages,
        customsRate: item.customsRate,
        vatRate: item.vatRate,
        unit: item.unit,
        status: item.status,
      })
    }
  })

  let posNo = 1
  return Array.from(map.values()).map(pos => ({ ...pos, positionNo: posNo++ }))
}
