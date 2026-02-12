//
//  YearView.swift
//  life-tracker-ios
//
//  Scrollable year grid; tap month → switch to calendar at that month. Full implementation in todo 5.
//

import SwiftUI

struct YearView: View {
    let entries: [Entry]
    let trackTypes: [TrackType]
    let onMonthTap: (Date) -> Void

    private let calendar = Calendar.gregorian
    private var currentMonthStart: Date { Date().startOfMonth(calendar: calendar) }

    /// Months from 10 years ago through current month, oldest first. In a 3-column grid, current month ends at bottom-right; scroll up to see previous years.
    private var monthsToShow: [Date] {
        let end = currentMonthStart
        var comps = calendar.dateComponents([.year, .month], from: end)
        comps.year! -= 10
        comps.month = 1
        comps.day = 1
        guard var d = calendar.date(from: comps) else { return [] }
        var result: [Date] = []
        while d <= end {
            result.append(d)
            d = calendar.date(byAdding: .month, value: 1, to: d) ?? d
        }
        return result
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                ], spacing: 12) {
                    ForEach(monthsToShow, id: \.self) { monthStart in
                        MonthMiniCell(
                            monthStart: monthStart,
                            entries: entriesForMonth(monthStart),
                            trackTypes: trackTypes,
                            isCurrent: calendar.isDate(monthStart, equalTo: currentMonthStart, toGranularity: .month)
                        ) {
                            onMonthTap(monthStart)
                        }
                        .id(monthStart)
                    }
                }
                .padding(.horizontal)
                .padding(.top, 16)
                .padding(.bottom, 100)
            }
            .onAppear {
                proxy.scrollTo(currentMonthStart, anchor: .bottom)
            }
        }
    }

    private func entriesForMonth(_ monthStart: Date) -> [Entry] {
        let comps = calendar.dateComponents([.year, .month], from: monthStart)
        guard let start = calendar.date(from: comps),
              let end = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: start) else { return [] }
        let startStr = Date.dateString(from: start)
        let endStr = Date.dateString(from: end)
        return entries.filter { $0.date >= startStr && $0.date <= endStr }
    }
}

struct MonthMiniCell: View {
    let monthStart: Date
    let entries: [Entry]
    let trackTypes: [TrackType]
    let isCurrent: Bool
    let onTap: () -> Void

    private let calendar = Calendar.gregorian
    private static let monthFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMM"
        return f
    }()
    private static let yearFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy"
        return f
    }()

    /// Fixed size so every month block is identical and never overlaps.
    private let dayCellSize: CGFloat = 14
    private let daySpacing: CGFloat = 2
    private var dayGridHeight: CGFloat {
        let rows: CGFloat = 6
        return rows * dayCellSize + (rows - 1) * daySpacing
    }
    /// One fixed height per cell: header + spacing + grid + padding. No clipping, no overlap.
    private static let headerHeight: CGFloat = 20
    private static let rowSpacing: CGFloat = 4
    private static let cellPadding: CGFloat = 8
    private var totalCellHeight: CGFloat {
        Self.headerHeight + Self.rowSpacing + dayGridHeight + Self.cellPadding * 2
    }

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: Self.rowSpacing) {
                HStack(spacing: 4) {
                    Text(Self.monthFormatter.string(from: monthStart))
                        .font(.caption.bold())
                    Text(Self.yearFormatter.string(from: monthStart))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(height: Self.headerHeight, alignment: .leading)
                miniDayGrid
            }
            .padding(Self.cellPadding)
            .frame(maxWidth: .infinity, minHeight: totalCellHeight, maxHeight: totalCellHeight, alignment: .topLeading)
            .background(isCurrent ? Color.accentColor.opacity(0.15) : Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    private var miniDayGrid: some View {
        let monthEnd = monthStart.endOfMonth(calendar: calendar)
        let calStart = monthStart.startOfWeek(calendar: calendar)
        let calEnd = monthEnd.endOfWeek(calendar: calendar)
        var days: [Date] = []
        var d = calStart
        while d <= calEnd {
            days.append(d)
            d = calendar.date(byAdding: .day, value: 1, to: d) ?? d
        }
        let columns = Array(repeating: GridItem(.flexible(), spacing: daySpacing), count: 7)
        return LazyVGrid(columns: columns, spacing: daySpacing) {
            ForEach(days, id: \.self) { (day: Date) in
                MiniDayCellView(
                    day: day,
                    monthStart: monthStart,
                    entries: entries,
                    calendar: calendar,
                    size: dayCellSize
                )
            }
        }
        .frame(minHeight: dayGridHeight, maxHeight: dayGridHeight, alignment: .top)
    }
}

private struct MiniDayCellView: View {
    let day: Date
    let monthStart: Date
    let entries: [Entry]
    let calendar: Calendar
    var size: CGFloat = 14

    private var dayColor: Color {
        let dateStr = Date.dateString(from: day)
        let inMonth = day.isInSameMonth(as: monthStart)
        let hasEntry = entries.contains { $0.date == dateStr }
        if !inMonth { return .clear }
        return hasEntry ? .primary : .secondary
    }

    var body: some View {
        Text("\(day.day(calendar: calendar))")
            .font(.system(size: 9, weight: .regular))
            .lineLimit(1)
            .minimumScaleFactor(0.7)
            .foregroundStyle(dayColor)
            .frame(width: size, height: size)
            .contentShape(Rectangle())
    }
}
