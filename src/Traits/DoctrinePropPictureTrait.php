<?php

namespace AmzsCMS\GalleryBundle\Traits;

use Doctrine\ORM\Mapping as ORM;
use Vich\UploaderBundle\Mapping\Annotation as Vich;

trait DoctrinePropPictureTrait
{
    /**
     * @ORM\Column(type="text", nullable="true")
     */
    private $name = null;

    /**
     * @ORM\Column(type="text", nullable="true")
     */
    private $image;

    /**
     * @return mixed
     */
    public function getImage()
    {
        return $this->image;
    }

    /**
     * @param mixed $image
     */
    public function setImage($image): void
    {
        $this->image = $image;
    }

    /**
     * @return mixed
     */
    public function getImageMobile()
    {
        return $this->imageMobile;
    }

    /**
     * @param mixed $imageMobile
     */
    public function setImageMobile($imageMobile): void
    {
        $this->imageMobile = $imageMobile;
    }

    /**
     * @return mixed
     */
    public function getLink()
    {
        return $this->link;
    }

    /**
     * @param mixed $link
     */
    public function setLink($link): void
    {
        $this->link = $link;
    }

    /**
     * @return mixed
     */
    public function getSortOrder()
    {
        return $this->sortOrder;
    }

    /**
     * @param mixed $sortOrder
     */
    public function setSortOrder($sortOrder): void
    {
        $this->sortOrder = $sortOrder;
    }

    /**
     * @ORM\Column(type="text",name="image_mobile", nullable=true)
     */
    private $imageMobile;

    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $link;

    /**
     * @ORM\Column(type="integer", nullable=true)
     */
    private $sortOrder;

    /**
     * @ORM\Column (type="string", length=255, nullable=true)
     */
    private $urlVideo;

    /**
     * @return mixed
     */
    public function getUrlVideo()
    {
        return $this->urlVideo;
    }

    /**
     * @param mixed $urlVideo
     */
    public function setUrlVideo($urlVideo): void
    {
        $this->urlVideo = $urlVideo;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): void
    {
        $this->name = $name;
    }

}