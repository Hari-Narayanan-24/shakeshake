import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChatDetailScreen } from "../screens/ChatDetailScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileTabScreen } from "../screens/ProfileTabScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { moderateScale, verticalScale } from "../constants/theme";
import { useThemeContext } from "../contexts/ThemeContext";

// ── Chat Stack ────────────────────────────────────────────────────

type ChatStackParamList = {
  ChatList: undefined;
  ChatDetail: { matchId: string; matchedUserName: string };
};

const ChatStack = createNativeStackNavigator<ChatStackParamList>();

function ChatStackNavigator({ userId }: { userId: string }) {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList">
        {({ navigation }) => (
          <ChatScreen
            userId={userId}
            onOpenConversation={(matchId, matchedUserName) =>
              navigation.navigate("ChatDetail", { matchId, matchedUserName })
            }
          />
        )}
      </ChatStack.Screen>
      <ChatStack.Screen name="ChatDetail">
        {({ route, navigation }) => (
          <ChatDetailScreen
            matchId={route.params.matchId}
            matchedUserName={route.params.matchedUserName}
            userId={userId}
            onBack={() => navigation.goBack()}
          />
        )}
      </ChatStack.Screen>
    </ChatStack.Navigator>
  );
}

// ── Profile Stack ────────────────────────────────────────────────

type ProfileStackParamList = {
  ProfileTab: undefined;
  Settings: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator({
  userId,
  userName,
  onLogout,
}: {
  userId: string;
  userName: string;
  onLogout: () => void;
}) {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileTab">
        {({ navigation }) => (
          <ProfileTabScreen
            userId={userId}
            userName={userName}
            onLogout={onLogout}
            onOpenSettings={() => navigation.navigate("Settings")}
          />
        )}
      </ProfileStack.Screen>
      <ProfileStack.Screen name="Settings">
        {({ navigation }) => (
          <SettingsScreen
            userId={userId}
            onBack={() => navigation.goBack()}
          />
        )}
      </ProfileStack.Screen>
    </ProfileStack.Navigator>
  );
}

// ── Main Tab Navigator ────────────────────────────────────────────

type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type MatchContext = {
  matchMood?: string;
  matchActivities?: string[];
};

type MainTabNavigatorProps = {
  userId: string;
  userName: string;
  onLogout: () => void;
};

export function MainTabNavigator({ userId, userName, onLogout }: MainTabNavigatorProps) {
  const { colors } = useThemeContext();
  const [currentMatchContext, setCurrentMatchContext] = useState<MatchContext>({});

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Feather>["name"] = "home";
          if (route.name === "Explore") iconName = "compass";
          if (route.name === "Chat") iconName = "message-circle";
          if (route.name === "Profile") iconName = "user";
          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: verticalScale(80),
          paddingBottom: verticalScale(10),
          paddingTop: verticalScale(8),
        },
        tabBarLabelStyle: {
          fontSize: moderateScale(12),
          fontWeight: "700",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: "Home" }}>
        {() => (
          <HomeScreen
            userId={userId}
            userName={userName}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Explore" options={{ tabBarLabel: "Explore" }}>
        {() => (
          <ExploreScreen
            userId={userId}
            matchMood={currentMatchContext.matchMood}
            matchActivities={currentMatchContext.matchActivities}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Chat" options={{ tabBarLabel: "Chat" }}>
        {() => <ChatStackNavigator userId={userId} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarLabel: "Profile" }}>
        {() => (
          <ProfileStackNavigator
            userId={userId}
            userName={userName}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
