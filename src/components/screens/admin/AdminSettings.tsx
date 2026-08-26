"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AssemblySettingsDTO, UserProfileDTO } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { Plus, X, Search, UserCheck, Shield } from "lucide-react";
import { toast } from "sonner";

export function AdminSettings() {
  const [settings, setSettings] = useState<AssemblySettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [admins, setAdmins] = useState<UserProfileDTO[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfileDTO[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, adminsData] = await Promise.all([
        api.settings.get(),
        fetch("/api/admin/admins").then(res => res.json())
      ]);
      setSettings(settingsData.settings);
      if (adminsData.admins) {
        setAdmins(adminsData.admins);
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updated: Partial<AssemblySettingsDTO>) => {
    if (!settings) return;
    try {
      setSaving(true);
      const res = await api.settings.update(updated);
      setSettings(res.settings);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const addRole = async () => {
    if (!newRole.trim() || !settings) return;
    if (settings.customRoles.includes(newRole.trim())) {
      toast.error("Role already exists");
      return;
    }
    const updatedRoles = [...settings.customRoles, newRole.trim()];
    await handleSave({ customRoles: updatedRoles });
    setNewRole("");
  };

  const removeRole = async (role: string) => {
    if (!settings) return;
    const updatedRoles = settings.customRoles.filter((r) => r !== role);
    await handleSave({ customRoles: updatedRoles });
  };

  const searchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSearch.trim()) return;
    try {
      const res = await fetch(`/api/admin/admins?q=${encodeURIComponent(adminSearch)}`);
      const data = await res.json();
      setSearchResults(data.admins || []);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const newRole = isCurrentlyAdmin ? "member" : "admin";
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update role");
      }
      toast.success(`User is now a ${newRole}`);
      // Refresh admins list
      const adminsRes = await fetch("/api/admin/admins").then(res => res.json());
      setAdmins(adminsRes.admins || []);
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  if (loading || !settings) return <LoadingScreen />;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Assembly Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage church configurations, roles, and administrative access.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="roles">Roles & Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>General Assembly Details</CardTitle>
              <CardDescription>Update your church's basic information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assembly Name</Label>
                  <Input 
                    value={settings.assemblyName}
                    onChange={(e) => setSettings({ ...settings, assemblyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location / District</Label>
                  <Input 
                    value={settings.assemblyLocation}
                    onChange={(e) => setSettings({ ...settings, assemblyLocation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    value={settings.assemblyAddress || ""}
                    onChange={(e) => setSettings({ ...settings, assemblyAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input 
                    value={settings.contactPhone || ""}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input 
                    type="email"
                    value={settings.contactEmail || ""}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4 mt-4">
              <Button onClick={() => handleSave({
                assemblyName: settings.assemblyName,
                assemblyLocation: settings.assemblyLocation,
                assemblyAddress: settings.assemblyAddress,
                contactPhone: settings.contactPhone,
                contactEmail: settings.contactEmail,
              })} disabled={saving}>
                Save General Details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure default access settings for members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 max-w-sm">
                <Label>Default Password for New Members</Label>
                <Input 
                  value={settings.defaultPassword}
                  onChange={(e) => setSettings({ ...settings, defaultPassword: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  This password will be used for all newly created member accounts until they change it.
                </p>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg max-w-lg">
                <div className="space-y-0.5">
                  <Label>Force Password Reset</Label>
                  <p className="text-sm text-slate-500">Require members to change the default password on first login.</p>
                </div>
                <Switch 
                  checked={settings.forcePasswordReset}
                  onCheckedChange={(checked) => setSettings({ ...settings, forcePasswordReset: checked })}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t pt-4 mt-4">
              <Button onClick={() => handleSave({
                defaultPassword: settings.defaultPassword,
                forcePasswordReset: settings.forcePasswordReset,
              })} disabled={saving}>
                Save Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Custom Assembly Roles</CardTitle>
              <CardDescription>Define roles that can be assigned to members (e.g., Presiding Elder, Deacon).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 max-w-md">
                <Input 
                  placeholder="New role name..." 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRole()}
                />
                <Button onClick={addRole} disabled={saving || !newRole.trim()}><Plus className="size-4 mr-1" /> Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {settings.customRoles.length === 0 ? (
                  <p className="text-sm text-slate-500">No custom roles defined yet.</p>
                ) : (
                  settings.customRoles.map((role) => (
                    <div key={role} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-sm font-medium">
                      {role}
                      <button onClick={() => removeRole(role)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="size-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Admins</CardTitle>
                <CardDescription>Users who have full access to the admin portal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div>
                        <p className="font-medium text-sm flex items-center gap-1.5">
                          {admin.fullName} <Shield className="size-3.5 text-caci-blue" />
                        </p>
                        <p className="text-xs text-slate-500">{admin.phone}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => toggleAdmin(admin.id, true)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assign Admin</CardTitle>
                <CardDescription>Search for users to grant admin privileges.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={searchUsers} className="flex gap-2">
                  <Input 
                    placeholder="Search by name or phone..." 
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                  />
                  <Button type="submit" variant="secondary"><Search className="size-4" /></Button>
                </form>
                <div className="space-y-3">
                  {searchResults.map((user) => {
                    const isAdmin = user.role === "admin";
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{user.fullName}</p>
                          <p className="text-xs text-slate-500">{user.phone}</p>
                        </div>
                        <Button 
                          variant={isAdmin ? "outline" : "default"} 
                          size="sm"
                          onClick={() => toggleAdmin(user.id, isAdmin)}
                        >
                          {isAdmin ? "Remove" : "Make Admin"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
