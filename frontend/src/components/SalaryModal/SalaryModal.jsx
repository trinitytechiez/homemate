import { useState, useMemo } from 'react'
import { addAdvance, deleteAdvance, recordPayment } from '../../utils/staffData'
import { getCurrencySymbol } from '../../utils/currency'
import styles from './SalaryModal.module.scss'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * SalaryModal — Three tabs:
 * 1. Salary Calculator (auto-calc from attendance)
 * 2. Payment Recording (mark paid / partial)
 * 3. Advance Tracking (record & delete cash advances)
 */
const SalaryModal = ({ staff, onStaffUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState('salary')

  // Pick displayed month (default = current month)
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()) // 0-indexed

  // ---- Utility ----
  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
  const currencySymbol = getCurrencySymbol(staff.currency || 'INR')

  const daysInMonth = useMemo(
    () => new Date(selectedYear, selectedMonth + 1, 0).getDate(),
    [selectedYear, selectedMonth]
  )

  // Calculate attendance for the selected month
  const attendance = useMemo(() => {
    let absentDays = 0
    let halfDays = 0
    const absentSet = new Set(staff.absentDates || [])
    const halfSet = new Set(staff.halfDayDates || [])

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (absentSet.has(key)) absentDays++
      else if (halfSet.has(key)) halfDays++
    }
    const presentDays = daysInMonth - absentDays - halfDays
    return { totalDays: daysInMonth, presentDays, absentDays, halfDays }
  }, [staff.absentDates, staff.halfDayDates, selectedYear, selectedMonth, daysInMonth])

  // Salary calculation
  const monthlySalary = staff.monthlySalary || 0
  const perDayRate = monthlySalary / daysInMonth
  const grossSalary = Math.round((attendance.presentDays + attendance.halfDays * 0.5) * perDayRate)
  const absentDeduction = Math.round(attendance.absentDays * perDayRate)
  const halfDayDeduction = Math.round(attendance.halfDays * 0.5 * perDayRate)

  // Pending advances (not yet deducted)
  const pendingAdvances = useMemo(
    () => (staff.advances || []).filter(a => !a.deducted),
    [staff.advances]
  )
  const totalPendingAdvance = pendingAdvances.reduce((s, a) => s + a.amount, 0)

  // Existing payment record for this month
  const existingPayment = useMemo(
    () => (staff.payments || []).find(p => p.month === monthKey),
    [staff.payments, monthKey]
  )

  // ---- SALARY TAB ----
  const [advanceDeductInput, setAdvanceDeductInput] = useState(
    existingPayment?.advanceDeducted ?? Math.min(totalPendingAdvance, grossSalary)
  )
  const advanceDeduct = Math.min(Number(advanceDeductInput) || 0, totalPendingAdvance)
  const netSalary = Math.max(0, grossSalary - advanceDeduct)

  // ---- PAYMENT TAB ----
  const [payStatus, setPayStatus] = useState(existingPayment?.status || 'paid')
  const [amountPaid, setAmountPaid] = useState(existingPayment?.amountPaid ?? netSalary)
  const [paidOn, setPaidOn] = useState(existingPayment?.paidOn || today.toISOString().split('T')[0])
  const [payNote, setPayNote] = useState(existingPayment?.note || '')
  const [isSavingPayment, setIsSavingPayment] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)

  // ---- ADVANCE TAB ----
  const [advAmount, setAdvAmount] = useState('')
  const [advDate, setAdvDate] = useState(today.toISOString().split('T')[0])
  const [advNote, setAdvNote] = useState('')
  const [isSavingAdv, setIsSavingAdv] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // ---- HANDLERS ----

  const handleSavePayment = async () => {
    setIsSavingPayment(true)
    try {
      const payload = {
        month: monthKey,
        year: selectedYear,
        totalDays: attendance.totalDays,
        presentDays: attendance.presentDays,
        halfDays: attendance.halfDays,
        absentDays: attendance.absentDays,
        grossSalary,
        deductions: absentDeduction + halfDayDeduction,
        advanceDeducted: advanceDeduct,
        netSalary,
        status: payStatus,
        amountPaid: Number(amountPaid) || 0,
        paidOn,
        note: payNote
      }
      const updated = await recordPayment(staff._id || staff.id, payload)
      onStaffUpdate(updated)
      setPaymentSaved(true)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSavingPayment(false)
    }
  }

  const handleWhatsAppShare = () => {
    const helperPhone = (staff.phoneNumber || '').replace('+', '').replace(/\s/g, '')
    const msg = [
      `*Salary Summary — ${MONTH_NAMES[selectedMonth]} ${selectedYear}*`,
      `Helper: ${staff.name}`,
      ``,
      `📅 Attendance (${daysInMonth} days)`,
      `  Present: ${attendance.presentDays} days`,
      `  Half-Day: ${attendance.halfDays} days`,
      `  Absent: ${attendance.absentDays} days`,
      ``,
      `💰 Salary Breakdown`,
      `  Monthly Salary: ${currencySymbol}${monthlySalary}`,
      `  Gross (earned): ${currencySymbol}${grossSalary}`,
      attendance.absentDays > 0 ? `  Absent deduction: -${currencySymbol}${absentDeduction}` : null,
      attendance.halfDays > 0 ? `  Half-day deduction: -${currencySymbol}${halfDayDeduction}` : null,
      advanceDeduct > 0 ? `  Advance deducted: -${currencySymbol}${advanceDeduct}` : null,
      `  *Net Payable: ${currencySymbol}${netSalary}*`,
      ``,
      `Sent via home/mate 🏠`
    ]
      .filter(l => l !== null)
      .join('\n')

    const url = helperPhone
      ? `https://wa.me/${helperPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const handleAddAdvance = async () => {
    if (!advAmount || Number(advAmount) <= 0) return
    setIsSavingAdv(true)
    try {
      const updated = await addAdvance(staff._id || staff.id, {
        amount: Number(advAmount),
        date: advDate,
        note: advNote
      })
      onStaffUpdate(updated)
      setAdvAmount('')
      setAdvNote('')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSavingAdv(false)
    }
  }

  const handleDeleteAdvance = async (advId) => {
    setDeletingId(advId)
    try {
      const updated = await deleteAdvance(staff._id || staff.id, advId)
      onStaffUpdate(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const statusBadge = {
    paid: { label: 'Paid', color: '#28a745' },
    partial: { label: 'Partial', color: '#fd7e14' },
    pending: { label: 'Pending', color: '#dc3545' }
  }

  return (
    <div className={styles.modal}>
      {/* Month Selector */}
      <div className={styles.monthRow}>
        <button
          className={styles.navBtn}
          onClick={() => {
            if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
            else setSelectedMonth(m => m - 1)
          }}
        >←</button>
        <span className={styles.monthLabel}>
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </span>
        <button
          className={styles.navBtn}
          onClick={() => {
            if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
            else setSelectedMonth(m => m + 1)
          }}
        >→</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[['salary', '💰 Calculator'], ['payment', '✅ Payment'], ['advance', '📤 Advance']].map(([id, label]) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ============ SALARY CALCULATOR TAB ============ */}
      {activeTab === 'salary' && (
        <div className={styles.tabContent}>
          <div className={styles.attendanceGrid}>
            <div className={styles.attBox}>
              <span className={styles.attNum}>{attendance.presentDays}</span>
              <span className={styles.attLabel}>Present</span>
            </div>
            <div className={`${styles.attBox} ${styles.attAbsent}`}>
              <span className={styles.attNum}>{attendance.absentDays}</span>
              <span className={styles.attLabel}>Absent</span>
            </div>
            <div className={`${styles.attBox} ${styles.attHalf}`}>
              <span className={styles.attNum}>{attendance.halfDays}</span>
              <span className={styles.attLabel}>Half Day</span>
            </div>
          </div>

          <div className={styles.calcCard}>
            <div className={styles.calcRow}>
              <span>Monthly Salary</span>
              <span>{currencySymbol}{monthlySalary.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.calcRow}>
              <span>Per Day Rate</span>
              <span>{currencySymbol}{Math.round(perDayRate).toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.calcRow}>
              <span>Gross Earned</span>
              <span className={styles.greenText}>{currencySymbol}{grossSalary.toLocaleString('en-IN')}</span>
            </div>
            {attendance.absentDays > 0 && (
              <div className={`${styles.calcRow} ${styles.deductRow}`}>
                <span>Absent Deduction ({attendance.absentDays}d)</span>
                <span>−{currencySymbol}{absentDeduction.toLocaleString('en-IN')}</span>
              </div>
            )}
            {attendance.halfDays > 0 && (
              <div className={`${styles.calcRow} ${styles.deductRow}`}>
                <span>Half-Day Deduction ({attendance.halfDays}d)</span>
                <span>−{currencySymbol}{halfDayDeduction.toLocaleString('en-IN')}</span>
              </div>
            )}
            {totalPendingAdvance > 0 && (
              <div className={styles.advanceDeductRow}>
                <label className={styles.advLabel}>
                  Advance Deduct (Pending: {currencySymbol}{totalPendingAdvance})
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalPendingAdvance}
                  className={styles.advInput}
                  value={advanceDeductInput}
                  onChange={e => setAdvanceDeductInput(e.target.value)}
                />
              </div>
            )}
            {advanceDeduct > 0 && (
              <div className={`${styles.calcRow} ${styles.deductRow}`}>
                <span>Advance Deducted</span>
                <span>−{currencySymbol}{advanceDeduct.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className={styles.divider}></div>
            <div className={`${styles.calcRow} ${styles.netRow}`}>
              <span>Net Payable</span>
              <span className={styles.netAmount}>{currencySymbol}{netSalary.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button className={styles.whatsappBtn} onClick={handleWhatsAppShare}>
            <span>📲</span> Share on WhatsApp
          </button>
        </div>
      )}

      {/* ============ PAYMENT RECORDING TAB ============ */}
      {activeTab === 'payment' && (
        <div className={styles.tabContent}>
          {existingPayment && (
            <div className={styles.existingBadge} style={{ borderColor: statusBadge[existingPayment.status]?.color }}>
              <span style={{ color: statusBadge[existingPayment.status]?.color, fontWeight: 700 }}>
                {statusBadge[existingPayment.status]?.label}
              </span>
              <span> — {currencySymbol}{existingPayment.amountPaid} paid on {existingPayment.paidOn}</span>
            </div>
          )}

          <div className={styles.calcCard} style={{ marginBottom: '1rem' }}>
            <div className={`${styles.calcRow} ${styles.netRow}`}>
              <span>Net Payable</span>
              <span className={styles.netAmount}>{currencySymbol}{netSalary.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Payment Status</label>
            <div className={styles.statusRow}>
              {['paid', 'partial', 'pending'].map(s => (
                <button
                  key={s}
                  className={`${styles.statusBtn} ${payStatus === s ? styles.statusActive : ''}`}
                  style={payStatus === s ? { background: statusBadge[s].color, borderColor: statusBadge[s].color } : {}}
                  onClick={() => setPayStatus(s)}
                >
                  {statusBadge[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Amount Paid ({currencySymbol})</label>
            <input
              type="number"
              className={styles.input}
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              min={0}
              placeholder={`${netSalary}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Date Paid</label>
            <input
              type="date"
              className={styles.input}
              value={paidOn}
              onChange={e => setPaidOn(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Note (optional)</label>
            <input
              type="text"
              className={styles.input}
              value={payNote}
              onChange={e => setPayNote(e.target.value)}
              placeholder="e.g. Paid via bank transfer"
            />
          </div>

          <button
            className={styles.primaryBtn}
            onClick={handleSavePayment}
            disabled={isSavingPayment}
          >
            {isSavingPayment ? 'Saving...' : paymentSaved ? '✅ Payment Saved!' : 'Record Payment'}
          </button>

          {paymentSaved && (
            <button className={styles.whatsappBtn} onClick={handleWhatsAppShare} style={{ marginTop: '0.75rem' }}>
              <span>📲</span> Share Salary Summary on WhatsApp
            </button>
          )}
        </div>
      )}

      {/* ============ ADVANCE TRACKING TAB ============ */}
      {activeTab === 'advance' && (
        <div className={styles.tabContent}>
          <div className={styles.advanceSummary}>
            <span>Total Pending Advances:</span>
            <span className={styles.advTotal}>{currencySymbol}{totalPendingAdvance.toLocaleString('en-IN')}</span>
          </div>

          {/* Add new advance */}
          <div className={styles.calcCard}>
            <h4 className={styles.cardTitle}>Record New Advance</h4>
            <div className={styles.formGroup}>
              <label className={styles.label}>Amount ({currencySymbol})</label>
              <input
                type="number"
                className={styles.input}
                value={advAmount}
                onChange={e => setAdvAmount(e.target.value)}
                placeholder="e.g. 500"
                min={1}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Date</label>
              <input
                type="date"
                className={styles.input}
                value={advDate}
                onChange={e => setAdvDate(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Note (optional)</label>
              <input
                type="text"
                className={styles.input}
                value={advNote}
                onChange={e => setAdvNote(e.target.value)}
                placeholder="e.g. Festival advance"
              />
            </div>
            <button
              className={styles.primaryBtn}
              onClick={handleAddAdvance}
              disabled={isSavingAdv || !advAmount || Number(advAmount) <= 0}
            >
              {isSavingAdv ? 'Saving...' : '+ Add Advance'}
            </button>
          </div>

          {/* Advances list */}
          <div className={styles.advanceList}>
            {(staff.advances || []).length === 0 ? (
              <p className={styles.emptyText}>No advances recorded yet.</p>
            ) : (
              [...(staff.advances || [])].reverse().map((adv) => (
                <div key={adv._id} className={`${styles.advanceItem} ${adv.deducted ? styles.advDeducted : ''}`}>
                  <div className={styles.advInfo}>
                    <span className={styles.advAmount}>
                      {currencySymbol}{adv.amount.toLocaleString('en-IN')}
                    </span>
                    <span className={styles.advDate}>{adv.date}</span>
                    {adv.note && <span className={styles.advNote}>{adv.note}</span>}
                  </div>
                  <div className={styles.advActions}>
                    {adv.deducted ? (
                      <span className={styles.deductedBadge}>Deducted</span>
                    ) : (
                      <button
                        className={styles.deleteAdvBtn}
                        onClick={() => handleDeleteAdvance(adv._id)}
                        disabled={deletingId === adv._id}
                      >
                        {deletingId === adv._id ? '...' : '🗑'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SalaryModal
