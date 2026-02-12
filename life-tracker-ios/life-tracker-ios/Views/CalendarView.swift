//
//  CalendarView.swift
//  life-tracker-ios
//

import SwiftUI

private let weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

struct CalendarView: View {
    @EnvironmentObject var dataStore: DataStore
    var scrollToMonth: Date?
    var onScrolledToTarget: (() -> Void)?
    var initialDate: Date?
    @Binding var triggerAddEntryForToday: Bool
    @Binding var triggerAddTrackType: Bool

    init(
        scrollToMonth: Date? = nil,
        onScrolledToTarget: (() -> Void)? = nil,
        initialDate: Date? = nil,
        triggerAddEntryForToday: Binding<Bool>,
        triggerAddTrackType: Binding<Bool>
    ) {
        self.scrollToMonth = scrollToMonth
        self.onScrolledToTarget = onScrolledToTarget
        self.initialDate = initialDate
        _triggerAddEntryForToday = triggerAddEntryForToday
        _triggerAddTrackType = triggerAddTrackType
    }

    @State private var selectedDay: Date?
    @State private var showDayDetail = false
    @State private var showEntryFormForNew = false
    @State private var editingEntry: Entry?
    @State private var showAddTrackType = false

    private let calendar = Calendar.gregorian
    private var now = Date()
    private var currentMonthStart: Date { now.startOfMonth(calendar: calendar) }

    private var months: [Date] {
        var list: [Date] = []
        var start = calendar.date(byAdding: .month, value: -12, to: currentMonthStart) ?? currentMonthStart
        if let initDate = initialDate {
            let initStart = initDate.startOfMonth(calendar: calendar)
            if initStart < start {
                start = calendar.date(byAdding: .month, value: -6, to: initStart) ?? initStart
            }
        }
        var d = start
        repeat {
            list.append(d)
            if calendar.isDate(d, equalTo: currentMonthStart, toGranularity: .month) { break }
            guard let next = calendar.date(byAdding: .month, value: 1, to: d) else { break }
            d = next
        } while true
        return list
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 24) {
                    ForEach(months, id: \.self) { monthStart in
                        monthSection(monthStart)
                            .id(monthId(monthStart))
                    }
                }
                .padding()
            }
            .onAppear {
                scrollToInitialPosition(proxy: proxy)
            }
            .onChange(of: scrollToMonth.map { $0.timeIntervalSince1970 } ?? 0) { _, _ in
                if let target = scrollToMonth {
                    withAnimation {
                        proxy.scrollTo(monthId(target.startOfMonth(calendar: calendar)), anchor: .top)
                    }
                    onScrolledToTarget?()
                }
            }
        }
        .sheet(isPresented: $showDayDetail) {
            if let day = selectedDay {
                DayDetailSheet(
                    date: day,
                    dayEntries: dataStore.entries.filter { $0.date == Date.dateString(from: day) },
                    trackTypes: dataStore.trackTypes,
                    onEdit: { entry in
                        editingEntry = entry
                        showDayDetail = false
                    },
                    onDelete: { id in
                        Task { try? await dataStore.deleteEntry(id: id) }
                    },
                    onSubmitNewEntry: { newEntry in
                        _ = try await dataStore.addEntry(newEntry)
                    }
                )
            }
        }
        .sheet(isPresented: $showEntryFormForNew) {
            if let day = selectedDay {
                EntryFormSheet(
                    date: day,
                    dateString: Date.dateString(from: day),
                    trackTypes: dataStore.trackTypes,
                    editingEntry: nil,
                    onSubmit: { newEntry in
                        _ = try await dataStore.addEntry(newEntry)
                    },
                    onUpdate: { _, _ in },
                    onDelete: nil,
                    onDismissDayDetail: nil
                )
            }
        }
        .sheet(item: $editingEntry) { entry in
            if let day = Date.from(dateString: entry.date) {
                EntryFormSheet(
                    date: day,
                    dateString: entry.date,
                    trackTypes: dataStore.trackTypes,
                    editingEntry: entry,
                    onSubmit: { _ in },
                    onUpdate: { id, updates in
                        try await dataStore.updateEntry(id: id, updates: updates)
                    },
                    onDelete: { id in
                        try await dataStore.deleteEntry(id: id)
                    },
                    onDismissDayDetail: { showDayDetail = false }
                )
            }
        }
        .sheet(isPresented: $showAddTrackType) {
            AddTrackTypeSheet(
                title: "Create Entry Type",
                existing: nil,
                onSave: { tt in _ = try await dataStore.addTrackType(tt) },
                onDelete: nil
            )
        }
        .onChange(of: triggerAddEntryForToday) { _, value in
            if value {
                selectedDay = Date()
                showEntryFormForNew = true
                triggerAddEntryForToday = false
            }
        }
        .onChange(of: triggerAddTrackType) { _, value in
            if value {
                showAddTrackType = true
                triggerAddTrackType = false
            }
        }
    }

    private func monthId(_ monthStart: Date) -> String {
        let comps = calendar.dateComponents([.year, .month], from: monthStart)
        return "\(comps.year!)-\(comps.month!)"
    }

    private func monthSection(_ monthStart: Date) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(monthTitle(monthStart))
                .font(.headline)
            monthGrid(monthStart)
        }
    }

    private func monthTitle(_ monthStart: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        return f.string(from: monthStart)
    }

    private func monthGrid(_ monthStart: Date) -> some View {
        let monthEnd = monthStart.endOfMonth(calendar: calendar)
        let calStart = monthStart.startOfWeek(calendar: calendar)
        let calEnd = monthEnd.endOfWeek(calendar: calendar)
        var days: [Date] = []
        var d = calStart
        while d <= calEnd {
            days.append(d)
            d = calendar.date(byAdding: .day, value: 1, to: d) ?? d
        }
        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
            ForEach(weekdays, id: \.self) { w in
                Text(w)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            ForEach(days, id: \.self) { day in
                DayCellView(
                    date: day,
                    currentMonth: monthStart,
                    entriesForDay: dataStore.entries.filter { $0.date == Date.dateString(from: day) },
                    trackTypes: dataStore.trackTypes,
                    onTap: {
                        selectedDay = day
                        showDayDetail = true
                    }
                )
            }
        }
    }

    private func scrollToInitialPosition(proxy: ScrollViewProxy) {
        let targetId = scrollToMonth.map { monthId($0.startOfMonth(calendar: calendar)) }
            ?? monthId(currentMonthStart)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            proxy.scrollTo(targetId, anchor: .bottom)
        }
    }
}
