//
//  DayCellView.swift
//  life-tracker-ios
//

import SwiftUI

struct DayCellView: View {
    let date: Date
    let currentMonth: Date
    let entriesForDay: [Entry]
    let trackTypes: [TrackType]
    let onTap: () -> Void

    private let calendar = Calendar.gregorian
    private var isCurrentMonth: Bool { date.isInSameMonth(as: currentMonth) }

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                Text("\(date.day(calendar: calendar))")
                    .font(.system(.body, design: .default))
                    .foregroundStyle(isCurrentMonth ? .primary : .secondary)
                if !entriesForDay.isEmpty {
                    HStack(spacing: 2) {
                        ForEach(uniqueTrackTypeIds(for: entriesForDay), id: \.self) { typeId in
                            if let tt = trackTypes.first(where: { $0.id == typeId }) {
                                Circle()
                                    .fill(Color(hex: tt.color))
                                    .frame(width: 5, height: 5)
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(isCurrentMonth ? Color.clear : Color(.tertiarySystemBackground))
        }
        .buttonStyle(.plain)
    }

    private func uniqueTrackTypeIds(for entries: [Entry]) -> [String] {
        var seen = Set<String>()
        return entries.compactMap { e in
            if seen.contains(e.trackTypeId) { return nil }
            seen.insert(e.trackTypeId)
            return e.trackTypeId
        }
    }
}
