//
//  CalendarTabView.swift
//  life-tracker-ios
//

import SwiftUI

/// Custom bordered styles for compatibility across SDK versions.
private struct BorderedButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(.secondarySystemFill), in: RoundedRectangle(cornerRadius: 8))
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

private struct BorderedProminentButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 8))
            .foregroundStyle(.white)
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

/// Single style type for ternary use so both branches match.
private struct ConfigurableBorderedButtonStyle: ButtonStyle {
    var isProminent: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isProminent ? Color.accentColor : Color(.secondarySystemFill), in: RoundedRectangle(cornerRadius: 8))
            .foregroundStyle(isProminent ? .white : .primary)
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

enum CalendarViewMode {
    case calendar
    case year
}

struct CalendarTabView: View {
    @EnvironmentObject var dataStore: DataStore
    @State private var viewMode: CalendarViewMode = .calendar
    @State private var scrollToMonth: Date?
    @State private var triggerAddEntryForToday = false
    @State private var triggerAddTrackType = false

    var body: some View {
        VStack(spacing: 0) {
            if viewMode == .calendar {
                quickAddButtons
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .padding(.bottom, 4)
            }

            Group {
                if viewMode == .calendar {
                    CalendarView(
                        scrollToMonth: scrollToMonth,
                        onScrolledToTarget: { scrollToMonth = nil },
                        initialDate: scrollToMonth,
                        triggerAddEntryForToday: $triggerAddEntryForToday,
                        triggerAddTrackType: $triggerAddTrackType
                    )
                } else {
                    YearView(
                        entries: dataStore.entries,
                        trackTypes: dataStore.trackTypes,
                        onMonthTap: { monthDate in
                            scrollToMonth = monthDate
                            viewMode = .calendar
                        }
                    )
                }
            }
            .environmentObject(dataStore)
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            viewModeToggle
        }
    }

    private var quickAddButtons: some View {
        HStack(spacing: 8) {
            Spacer(minLength: 0)
            Button {
                triggerAddTrackType = true
            } label: {
                Label("Add entry type", systemImage: "list.bullet.badge.plus")
            }
            .buttonStyle(BorderedButtonStyle())
            Button {
                triggerAddEntryForToday = true
            } label: {
                Label("Add entry", systemImage: "plus.circle.fill")
            }
            .buttonStyle(BorderedProminentButtonStyle())
        }
    }

    private var viewModeToggle: some View {
        HStack(spacing: 0) {
            Button {
                viewMode = .year
            } label: {
                Label("Year", systemImage: "square.grid.2x2")
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
            }
            .buttonStyle(ConfigurableBorderedButtonStyle(isProminent: viewMode == .year))
            Button {
                viewMode = .calendar
            } label: {
                Label("Calendar", systemImage: "calendar")
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
            }
            .buttonStyle(ConfigurableBorderedButtonStyle(isProminent: viewMode == .calendar))
        }
        .padding(4)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }
}
