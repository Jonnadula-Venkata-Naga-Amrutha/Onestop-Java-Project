package com.skillbridge.model;

import java.util.ArrayList;
import java.util.List;

public class ProviderProfile {
    private String id;
    private String userId;
    private String fullName;
    private String businessName;
    private String bio;
    private int yearsExperience;
    private double ratingAvg;
    private int reviewCount;
    private int completedJobsCount;
    private boolean isVerified;
    private boolean emergencyAvailable;
    private double baseHourlyRate;
    private String city;
    private List<String> localities = new ArrayList<>();
    private List<String> serviceCategories = new ArrayList<>();

    public ProviderProfile() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public int getYearsExperience() { return yearsExperience; }
    public void setYearsExperience(int yearsExperience) { this.yearsExperience = yearsExperience; }

    public double getRatingAvg() { return ratingAvg; }
    public void setRatingAvg(double ratingAvg) { this.ratingAvg = ratingAvg; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    public int getCompletedJobsCount() { return completedJobsCount; }
    public void setCompletedJobsCount(int completedJobsCount) { this.completedJobsCount = completedJobsCount; }

    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { isVerified = verified; }

    public boolean isEmergencyAvailable() { return emergencyAvailable; }
    public void setEmergencyAvailable(boolean emergencyAvailable) { this.emergencyAvailable = emergencyAvailable; }

    public double getBaseHourlyRate() { return baseHourlyRate; }
    public void setBaseHourlyRate(double baseHourlyRate) { this.baseHourlyRate = baseHourlyRate; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public List<String> getLocalities() { return localities; }
    public void setLocalities(List<String> localities) { this.localities = localities; }

    public List<String> getServiceCategories() { return serviceCategories; }
    public void setServiceCategories(List<String> serviceCategories) { this.serviceCategories = serviceCategories; }
}
